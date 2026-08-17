import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAppAlert } from '../../context/AppAlertContext';
import Avatar from '../../components/Avatar';
import Hoverable from '../../components/Hoverable';
import { darken, lighten } from '../../utils/color';
import { FONT_DISPLAY, FONT_DISPLAY_ITALIC } from '../../theme/typography';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const formatSince = (iso) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
};

const copyToClipboard = async (text) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // sigue al fallback
  }
  return false;
};

function Tag({ tag, style }) {
  return <Text style={style}>#{tag}</Text>;
}

export default function FriendsScreen({ onOpenGroups }) {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { notify, confirm } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const myId = session?.user?.id;
  const myHandle = profile?.username && profile?.tag ? `${profile.username}#${profile.tag}` : null;

  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);

  const load = useCallback(async () => {
    if (!myId) return;
    const { data: rows } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);

    const accepted = (rows || []).filter((r) => r.status === 'accepted');
    const incomingPending = (rows || []).filter((r) => r.status === 'pending' && r.addressee_id === myId);
    const outgoingPending = (rows || []).filter((r) => r.status === 'pending' && r.requester_id === myId);

    const otherIds = (list) => list.map((r) => (r.requester_id === myId ? r.addressee_id : r.requester_id));

    const [friendProfiles, incomingProfiles, outgoingProfiles] = await Promise.all([
      otherIds(accepted).length
        ? supabase.from('friend_profiles').select('*').in('id', otherIds(accepted))
        : Promise.resolve({ data: [] }),
      incomingPending.length
        ? supabase.from('searchable_profiles').select('*').in('id', otherIds(incomingPending))
        : Promise.resolve({ data: [] }),
      outgoingPending.length
        ? supabase.from('searchable_profiles').select('*').in('id', otherIds(outgoingPending))
        : Promise.resolve({ data: [] }),
    ]);

    const byId = (list) => Object.fromEntries((list || []).map((p) => [p.id, p]));
    const friendMap = byId(friendProfiles.data);
    const incomingMap = byId(incomingProfiles.data);
    const outgoingMap = byId(outgoingProfiles.data);

    setFriends(accepted.map((r) => {
      const otherId = r.requester_id === myId ? r.addressee_id : r.requester_id;
      return { friendshipId: r.id, ...friendMap[otherId] };
    }).filter((f) => f.id));
    setIncoming(incomingPending.map((r) => ({ friendshipId: r.id, ...incomingMap[r.requester_id] })).filter((f) => f.id));
    setOutgoing(outgoingPending.map((r) => ({ friendshipId: r.id, ...outgoingMap[r.addressee_id] })).filter((f) => f.id));
    setLoading(false);
  }, [myId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timeout = setTimeout(async () => {
      const tagMatch = query.match(/^(.+)#([A-Za-z0-9]{6})$/);
      let request;
      if (tagMatch) {
        request = supabase
          .from('searchable_profiles')
          .select('*')
          .ilike('username', tagMatch[1])
          .eq('tag', tagMatch[2].toUpperCase())
          .neq('id', myId)
          .limit(8);
      } else {
        request = supabase
          .from('searchable_profiles')
          .select('*')
          .ilike('username', `%${query}%`)
          .neq('id', myId)
          .limit(8);
      }
      const { data } = await request;
      if (!cancelled) {
        setResults(data || []);
        setSearching(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [search, myId]);

  const knownIds = useMemo(() => new Set([
    ...friends.map((f) => f.id),
    ...incoming.map((f) => f.id),
    ...outgoing.map((f) => f.id),
  ]), [friends, incoming, outgoing]);

  const sendRequest = async (target) => {
    setPendingAction(target.id);
    try {
      const reverse = await supabase
        .from('friendships')
        .select('id, status')
        .eq('requester_id', target.id)
        .eq('addressee_id', myId)
        .maybeSingle();

      if (reverse.data && reverse.data.status === 'pending') {
        await supabase.from('friendships').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', reverse.data.id);
        notify({ title: 'Ya son amigos', message: `${target.username}#${target.tag} también te había mandado solicitud.`, variant: 'success' });
      } else {
        const { error } = await supabase.from('friendships').insert({ requester_id: myId, addressee_id: target.id });
        if (error) throw error;
        notify({ title: 'Solicitud enviada', message: `Le avisamos a ${target.username}#${target.tag}.`, variant: 'success' });
      }
      setSearch('');
      await load();
    } catch (error) {
      notify({ title: 'No se pudo enviar', message: error.message || 'Intenta de nuevo.', variant: 'error' });
    } finally {
      setPendingAction(null);
    }
  };

  const acceptRequest = async (row) => {
    setPendingAction(row.friendshipId);
    try {
      await supabase.from('friendships').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', row.friendshipId);
      await load();
    } finally {
      setPendingAction(null);
    }
  };

  const removeFriendship = async (row) => {
    setPendingAction(row.friendshipId);
    try {
      await supabase.from('friendships').delete().eq('id', row.friendshipId);
      await load();
    } finally {
      setPendingAction(null);
    }
  };

  const handleUnfriend = (row) => {
    confirm({
      title: 'Quitar amigo',
      message: `${row.username}#${row.tag} ya no va a poder ver tu foto ni tus grupos compartidos.`,
      confirmText: 'Quitar',
      cancelText: 'Cancelar',
      destructive: true,
      onConfirm: () => removeFriendship(row),
    });
  };

  const handleCopyHandle = async () => {
    if (!myHandle) return;
    const copied = Platform.OS === 'web' ? await copyToClipboard(myHandle) : false;
    notify({
      title: copied ? 'Código copiado' : 'Tu código',
      message: copied ? `${myHandle} está en tu portapapeles.` : `Compártelo tal cual: ${myHandle}`,
      variant: 'success',
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!!myHandle && (
        <LinearGradient
          colors={[darken(colors.primary, 0.35), colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.handleCard}
        >
          <View style={styles.handleTextCol}>
            <Text style={styles.handleLabel}>Tu código</Text>
            <Text style={styles.handleValue}>{profile.username}<Text style={styles.handleTag}>#{profile.tag}</Text></Text>
            <Text style={styles.handleHint}>Compártelo para que te agreguen. Hay más de una persona con tu mismo nombre.</Text>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyHandle} accessibilityRole="button" accessibilityLabel="Copiar tu código">
            <Ionicons name="copy-outline" size={17} color={colors.primary} />
          </TouchableOpacity>
        </LinearGradient>
      )}

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={19} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o nombre#código"
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          accessibilityLabel="Buscar amigos"
        />
      </View>

      {search.trim().length >= 2 && (
        <View style={styles.section}>
          {searching ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
          ) : results.length === 0 ? (
            <Text style={styles.emptyHint}>Nadie con ese nombre o código.</Text>
          ) : (
            <View style={styles.list}>
              {results.map((r) => {
                const already = knownIds.has(r.id);
                return (
                  <View key={r.id} style={styles.row}>
                    <View style={styles.rowIconPlain}>
                      <Ionicons name="person-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowLabel}>{r.username}<Tag tag={r.tag} style={styles.rowTag} /></Text>
                    </View>
                    {already ? (
                      <Text style={styles.alreadyText}>Ya agregado</Text>
                    ) : (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => sendRequest(r)}
                        disabled={pendingAction === r.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Agregar a ${r.username}#${r.tag}`}
                      >
                        {pendingAction === r.id ? (
                          <ActivityIndicator size="small" color={colors.background} />
                        ) : (
                          <Text style={styles.addButtonText}>Agregar</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      <Hoverable scaleTo={1.01}>
        {({ hovered }) => (
          <TouchableOpacity
            style={[styles.groupsRow, hovered && styles.groupsRowHovered]}
            onPress={onOpenGroups}
            accessibilityRole="button"
            accessibilityLabel="Ver grupos"
          >
            <LinearGradient
              colors={[darken(colors.primary, 0.3), colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.groupsIcon}
            >
              <Ionicons name="people" size={18} color={colors.background} />
            </LinearGradient>
            <View style={styles.rowTextCol}>
              <Text style={styles.groupsTitle}>Grupos</Text>
              <Text style={styles.rowSub}>Organiza a tus amigos por sección o curso</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </TouchableOpacity>
        )}
      </Hoverable>

      {incoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Solicitudes recibidas</Text>
          <View style={styles.list}>
            {incoming.map((r) => (
              <View key={r.friendshipId} style={styles.row}>
                <View style={styles.rowIconPlain}>
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowLabel}>{r.username}<Tag tag={r.tag} style={styles.rowTag} /></Text>
                </View>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => removeFriendship(r)}
                  disabled={pendingAction === r.friendshipId}
                  accessibilityRole="button"
                  accessibilityLabel={`Rechazar a ${r.username}#${r.tag}`}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.iconButtonAccept]}
                  onPress={() => acceptRequest(r)}
                  disabled={pendingAction === r.friendshipId}
                  accessibilityRole="button"
                  accessibilityLabel={`Aceptar a ${r.username}#${r.tag}`}
                >
                  {pendingAction === r.friendshipId ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Ionicons name="checkmark" size={18} color={colors.background} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {outgoing.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Solicitudes enviadas</Text>
          <View style={styles.list}>
            {outgoing.map((r) => (
              <View key={r.friendshipId} style={styles.row}>
                <View style={styles.rowIconPlain}>
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowLabel}>{r.username}<Tag tag={r.tag} style={styles.rowTag} /></Text>
                </View>
                <Text style={styles.pendingText}>Pendiente</Text>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => removeFriendship(r)}
                  disabled={pendingAction === r.friendshipId}
                  accessibilityRole="button"
                  accessibilityLabel={`Cancelar solicitud a ${r.username}#${r.tag}`}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Tus amigos{friends.length > 0 ? ` (${friends.length})` : ''}</Text>
        {friends.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBadge}>
              <Ionicons name="people-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Todavía no tienes amigos</Text>
            <Text style={styles.emptyBody}>Busca a alguien por su nombre o su código para empezar.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {friends.map((f) => (
              <Hoverable key={f.friendshipId} scaleTo={1.01}>
                {({ hovered }) => (
                  <View style={[styles.friendRow, hovered && styles.rowHovered]}>
                    <LinearGradient
                      colors={[lighten(colors.primarySoft, 0.18), colors.primarySoft]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarRing}
                    >
                      <Avatar uri={f.avatar_url} label={(f.username?.[0] || '?').toUpperCase()} size={40} fontSize={16} />
                    </LinearGradient>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.friendName}>{f.username}<Tag tag={f.tag} style={styles.rowTag} /></Text>
                      {!!f.created_at && <Text style={styles.rowSub}>En Nutriva desde {formatSince(f.created_at)}</Text>}
                    </View>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleUnfriend(f)}
                      disabled={pendingAction === f.friendshipId}
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar a ${f.username}#${f.tag}`}
                    >
                      <Ionicons name="person-remove-outline" size={17} color={colors.textFaint} />
                    </TouchableOpacity>
                  </View>
                )}
              </Hoverable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  handleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    gap: 12,
  },
  handleTextCol: { flex: 1 },
  handleLabel: { fontSize: 11, fontWeight: '700', color: colors.background, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 0.6 },
  handleValue: { fontSize: 19, fontFamily: FONT_DISPLAY, color: colors.background, marginTop: 4 },
  handleTag: { fontFamily: FONT_DISPLAY_ITALIC, opacity: 0.75 },
  handleHint: { fontSize: 11.5, color: colors.background, opacity: 0.8, marginTop: 6, lineHeight: 15 },
  copyButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrapper: { justifyContent: 'center', marginBottom: 16 },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingVertical: 12,
    paddingLeft: 44,
    paddingRight: 14,
    fontSize: 15,
    minHeight: 48,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  emptyHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 14 },

  groupsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    minHeight: 64,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  groupsRowHovered: { borderColor: colors.primary, shadowOpacity: 0.1 },
  groupsIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  groupsTitle: { fontSize: 15, fontFamily: FONT_DISPLAY, color: colors.text },

  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    minHeight: 56,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    minHeight: 64,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowHovered: { borderColor: colors.primary },
  rowIconPlain: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  rowTextCol: { flex: 1 },
  rowLabel: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  friendName: { fontSize: 15, fontFamily: FONT_DISPLAY, color: colors.text },
  rowTag: { fontSize: 12, fontWeight: '600', color: colors.textFaint },
  rowSub: { fontSize: 11.5, color: colors.textFaint, marginTop: 2 },

  addButton: { minHeight: 34, minWidth: 76, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  addButtonText: { color: colors.background, fontSize: 12.5, fontWeight: '700' },
  alreadyText: { fontSize: 11.5, color: colors.textFaint, fontStyle: 'italic' },
  pendingText: { fontSize: 11.5, color: colors.textFaint, marginRight: 4 },

  iconButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  iconButtonAccept: { backgroundColor: colors.primary },

  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 28, borderRadius: 20, backgroundColor: colors.surfaceMuted },
  emptyIconBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: 15, fontFamily: FONT_DISPLAY, color: colors.text },
  emptyBody: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 30, lineHeight: 17 },
});
