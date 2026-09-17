import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useAppAlert } from '../context/AppAlertContext';
import { darken } from '../utils/color';
import { FONT_DISPLAY } from '../theme/typography';
import Avatar from './Avatar';
import useResponsive from '../hooks/useResponsive';

const buildAttachment = (item) => ({
  label: item.label,
  activity_label: item.activity_label,
  activity_key: item.activity_key,
  activity_factor: item.activity_factor,
  formula_key: item.formula_key,
  formula_label: item.formula_label,
  sex: item.sex,
  weight: item.weight,
  height: item.height,
  age: item.age,
  tmb: item.tmb,
  get: item.get,
});

export default function ShareCaseModal({ visible, item, onClose }) {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const { notify } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const myId = session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [sendingKey, setSendingKey] = useState(null);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(40)).current;
  const sheetScale = useRef(new Animated.Value(0.95)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    overlayOpacity.setValue(0);
    sheetY.setValue(40);
    sheetScale.setValue(0.95);
    sheetOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      isDesktop
        ? Animated.spring(sheetScale, { toValue: 1, useNativeDriver: true, friction: 9, tension: 90 })
        : Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 90 }),
    ]).start();
  }, [visible, isDesktop]);

  useEffect(() => {
    if (!visible || !myId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [friendshipsRes, groupsRes] = await Promise.all([
        supabase.from('friendships').select('*').eq('status', 'accepted').or(`requester_id.eq.${myId},addressee_id.eq.${myId}`),
        supabase.from('groups').select('id, name').order('name', { ascending: true }),
      ]);
      const rows = friendshipsRes.data || [];
      const otherIds = rows.map((r) => (r.requester_id === myId ? r.addressee_id : r.requester_id));
      const profilesRes = otherIds.length
        ? await supabase.from('friend_profiles').select('*').in('id', otherIds)
        : { data: [] };
      const byId = Object.fromEntries((profilesRes.data || []).map((p) => [p.id, p]));
      const friendsList = rows
        .map((r) => {
          const otherId = r.requester_id === myId ? r.addressee_id : r.requester_id;
          return { friendshipId: r.id, ...byId[otherId] };
        })
        .filter((f) => f.id);
      if (!cancelled) {
        setFriends(friendsList);
        setGroups(groupsRes.data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [visible, myId]);

  const sendTo = async (target) => {
    if (!item || sendingKey) return;
    setSendingKey(target.key);
    const payload = {
      sender_id: myId,
      attachment_kind: 'calculation',
      attachment: buildAttachment(item),
      ...(target.type === 'friend' ? { friendship_id: target.friendshipId } : { group_id: target.groupId }),
    };
    const { error } = await supabase.from('messages').insert(payload);
    setSendingKey(null);
    if (error) {
      notify({ title: 'No se pudo compartir', message: error.message || 'Intenta de nuevo.', variant: 'error' });
      return;
    }
    notify({ title: 'Caso compartido', message: `Se envió a ${target.name}.`, variant: 'success' });
    onClose();
  };

  if (!visible) return null;

  const hasAnything = friends.length > 0 || groups.length > 0;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, isDesktop && styles.overlayDesktop, { opacity: overlayOpacity }]}>
        <Pressable style={styles.overlayPress} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            isDesktop && styles.sheetDesktop,
            {
              opacity: sheetOpacity,
              transform: isDesktop ? [{ scale: sheetScale }] : [{ translateY: sheetY }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Compartir caso</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : !hasAnything ? (
            <Text style={styles.emptyHint}>Todavía no tienes amigos ni grupos para compartir este caso.</Text>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {friends.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Amigos</Text>
                  {friends.map((f) => {
                    const key = `friend-${f.friendshipId}`;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.row}
                        onPress={() => sendTo({ key, type: 'friend', friendshipId: f.friendshipId, name: `${f.username}#${f.tag}` })}
                        disabled={!!sendingKey}
                        accessibilityRole="button"
                        accessibilityLabel={`Compartir con ${f.username}#${f.tag}`}
                      >
                        <Avatar uri={f.avatar_url} label={(f.username?.[0] || '?').toUpperCase()} size={38} fontSize={15} />
                        <Text style={styles.rowLabel} numberOfLines={1}>{f.username}<Text style={styles.rowTag}>#{f.tag}</Text></Text>
                        {sendingKey === key ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {groups.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Grupos</Text>
                  {groups.map((g) => {
                    const key = `group-${g.id}`;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.row}
                        onPress={() => sendTo({ key, type: 'group', groupId: g.id, name: g.name })}
                        disabled={!!sendingKey}
                        accessibilityRole="button"
                        accessibilityLabel={`Compartir con el grupo ${g.name}`}
                      >
                        <LinearGradient
                          colors={[darken(colors.primary, 0.3), colors.primary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.groupIcon}
                        >
                          <Ionicons name="people" size={16} color={colors.background} />
                        </LinearGradient>
                        <Text style={styles.rowLabel} numberOfLines={1}>{g.name}</Text>
                        {sendingKey === key ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  overlayPress: { ...StyleSheet.absoluteFillObject },
  overlayDesktop: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingBottom: 24,
    paddingHorizontal: 20,
    maxHeight: '75%',
  },
  sheetDesktop: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    maxHeight: 520,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 17, fontFamily: FONT_DISPLAY, color: colors.text },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },

  loader: { marginVertical: 30 },
  emptyHint: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10 },

  list: { marginTop: 6 },
  listContent: { paddingBottom: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingVertical: 6,
  },
  groupIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14.5, color: colors.text, fontWeight: '600' },
  rowTag: { fontSize: 12, fontWeight: '600', color: colors.textFaint },
});
