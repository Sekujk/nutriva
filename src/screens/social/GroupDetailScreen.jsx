import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAppAlert } from '../../context/AppAlertContext';
import Avatar from '../../components/Avatar';
import Hoverable from '../../components/Hoverable';
import FriendProfileModal from '../../components/FriendProfileModal';
import { lighten } from '../../utils/color';
import { FONT_DISPLAY } from '../../theme/typography';
import SubScreenHeader from '../profile/SubScreenHeader';
import ChatView from './ChatView';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const formatSince = (iso) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
};

export default function GroupDetailScreen({ groupId, groupName, onBack, onGroupDeleted }) {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { notify, confirm } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const myId = session?.user?.id;

  const [tab, setTab] = useState('chat');
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);

  const isOwner = group?.owner_id === myId;

  const membersById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);

  const load = useCallback(async () => {
    const [{ data: groupRow }, { data: memberRows }] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase.from('group_members').select('user_id, added_at').eq('group_id', groupId),
    ]);
    setGroup(groupRow || null);

    const ids = (memberRows || []).map((m) => m.user_id);
    const { data: profiles } = ids.length
      ? await supabase.from('friend_profiles').select('*').in('id', ids)
      : { data: [] };
    const byId = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

    setMembers((memberRows || []).map((m) => ({ ...byId[m.user_id], addedAt: m.added_at })).filter((m) => m.id));
    setLoading(false);
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const openPicker = async () => {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);

    const memberIds = new Set(members.map((m) => m.id));
    const friendIds = (friendships || [])
      .map((f) => (f.requester_id === myId ? f.addressee_id : f.requester_id))
      .filter((id) => !memberIds.has(id));

    if (friendIds.length === 0) {
      notify({ title: 'Sin amigos para agregar', message: 'Todos tus amigos ya están en este grupo, o todavía no tienes amigos.', variant: 'info' });
      return;
    }

    const { data: profiles } = await supabase.from('searchable_profiles').select('*').in('id', friendIds);
    setCandidates(profiles || []);
    setPickerOpen(true);
  };

  const addMember = async (candidate) => {
    setBusyId(candidate.id);
    try {
      const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: candidate.id });
      if (error) throw error;
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
      await load();
    } catch (error) {
      notify({ title: 'No se pudo agregar', message: error.message || 'Intenta de nuevo.', variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (member) => {
    setBusyId(member.id);
    try {
      await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', member.id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveMember = (member) => {
    const isMe = member.id === myId;
    confirm({
      title: isMe ? 'Salir del grupo' : 'Quitar del grupo',
      message: isMe
        ? `Vas a salir de "${group?.name}".`
        : `${member.username}#${member.tag} ya no va a ver a los demás miembros de "${group?.name}".`,
      confirmText: isMe ? 'Salir' : 'Quitar',
      cancelText: 'Cancelar',
      destructive: true,
      onConfirm: async () => {
        await removeMember(member);
        if (isMe) onBack();
      },
    });
  };

  const handleDeleteGroup = () => {
    confirm({
      title: 'Eliminar grupo',
      message: `Se elimina "${group?.name}" para todos los miembros. Esto no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
      onConfirm: async () => {
        await supabase.from('groups').delete().eq('id', groupId);
        onGroupDeleted?.();
      },
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
    <View style={styles.flex}>
      <View style={styles.headerArea}>
        <SubScreenHeader title={group?.name || groupName || 'Grupo'} onBack={onBack} />
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'chat' && styles.tabButtonActive]}
            onPress={() => setTab('chat')}
            accessibilityRole="button"
            accessibilityLabel="Ver chat del grupo"
          >
            <Text style={[styles.tabText, tab === 'chat' && styles.tabTextActive]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'members' && styles.tabButtonActive]}
            onPress={() => setTab('members')}
            accessibilityRole="button"
            accessibilityLabel="Ver miembros del grupo"
          >
            <Text style={[styles.tabText, tab === 'members' && styles.tabTextActive]}>Miembros ({members.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'chat' ? (
        <ChatView filterColumn="group_id" filterValue={groupId} participantsById={membersById} showSenderName />
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {pickerOpen && (
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Agregar de tus amigos</Text>
                <TouchableOpacity onPress={() => setPickerOpen(false)} accessibilityRole="button" accessibilityLabel="Cerrar">
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {candidates.length === 0 ? (
                <Text style={styles.emptyHint}>No queda nadie para agregar.</Text>
              ) : (
                candidates.map((c) => (
                  <View key={c.id} style={styles.pickerRow}>
                    <Text style={styles.rowLabel}>{c.username}<Text style={styles.rowTag}>#{c.tag}</Text></Text>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => addMember(c)}
                      disabled={busyId === c.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Agregar a ${c.username}#${c.tag}`}
                    >
                      {busyId === c.id ? <ActivityIndicator size="small" color={colors.background} /> : <Text style={styles.addButtonText}>Agregar</Text>}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {isOwner && !pickerOpen && (
            <Hoverable scaleTo={1.01}>
              {({ hovered }) => (
                <TouchableOpacity
                  style={[styles.newGroupButton, hovered && styles.newGroupButtonHovered]}
                  onPress={openPicker}
                  accessibilityRole="button"
                  accessibilityLabel="Agregar miembro"
                >
                  <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                  <Text style={styles.newGroupText}>Agregar miembro</Text>
                </TouchableOpacity>
              )}
            </Hoverable>
          )}

          <View style={styles.list}>
            {members.map((m) => (
              <Hoverable key={m.id} scaleTo={1.01}>
                {({ hovered }) => (
                  <View style={[styles.row, hovered && styles.rowHovered]}>
                    <TouchableOpacity
                      onPress={() => setViewingProfile(m)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver perfil de ${m.username}#${m.tag}`}
                    >
                      <LinearGradient
                        colors={[lighten(colors.primarySoft, 0.18), colors.primarySoft]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarRing}
                      >
                        <Avatar uri={m.avatar_url} label={(m.username?.[0] || '?').toUpperCase()} size={40} fontSize={16} />
                      </LinearGradient>
                    </TouchableOpacity>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowLabel}>{m.username}<Text style={styles.rowTag}>#{m.tag}</Text>{m.id === myId ? ' (tú)' : ''}</Text>
                      {!!m.created_at && <Text style={styles.rowSub}>En Nutriva desde {formatSince(m.created_at)}</Text>}
                    </View>
                    {(isOwner || m.id === myId) && (
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleRemoveMember(m)}
                        disabled={busyId === m.id}
                        accessibilityRole="button"
                        accessibilityLabel={m.id === myId ? 'Salir del grupo' : `Quitar a ${m.username}#${m.tag}`}
                      >
                        <Ionicons name={m.id === myId ? 'exit-outline' : 'person-remove-outline'} size={17} color={colors.textFaint} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Hoverable>
            ))}
          </View>

          {isOwner && (
            <TouchableOpacity style={styles.deleteLink} onPress={handleDeleteGroup} accessibilityRole="button" accessibilityLabel="Eliminar grupo">
              <Text style={styles.deleteLinkText}>Eliminar grupo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <FriendProfileModal visible={!!viewingProfile} profile={viewingProfile} onClose={() => setViewingProfile(null)} />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingTop: 4, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  headerArea: { padding: 20, paddingBottom: 0 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  tabButtonActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13.5, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.background },

  newGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  newGroupButtonHovered: { backgroundColor: colors.primarySoft },
  newGroupText: { color: colors.primary, fontSize: 14, fontWeight: '700' },

  pickerCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, gap: 10 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  pickerTitle: { fontSize: 14, fontFamily: FONT_DISPLAY, color: colors.text },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  emptyHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 10 },

  list: { gap: 10 },
  row: {
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
  avatarRing: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  rowTextCol: { flex: 1 },
  rowLabel: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  rowTag: { fontSize: 12, fontWeight: '600', color: colors.textFaint },
  rowSub: { fontSize: 11.5, color: colors.textFaint, marginTop: 2 },

  addButton: { minHeight: 34, minWidth: 76, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  addButtonText: { color: colors.background, fontSize: 12.5, fontWeight: '700' },

  iconButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },

  deleteLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  deleteLinkText: { color: colors.textFaint, fontSize: 12.5, fontWeight: '600', textDecorationLine: 'underline' },
});
