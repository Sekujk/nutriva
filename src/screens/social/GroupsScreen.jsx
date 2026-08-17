import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAppAlert } from '../../context/AppAlertContext';
import Hoverable from '../../components/Hoverable';
import { darken } from '../../utils/color';
import { FONT_DISPLAY } from '../../theme/typography';
import SubScreenHeader from '../profile/SubScreenHeader';

export default function GroupsScreen({ onBack, onOpenGroup }) {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { notify } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const myId = session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('groups').select('*, group_members(user_id)').order('created_at', { ascending: false });
    setGroups(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createGroup = async () => {
    const name = newName.trim();
    if (name.length < 2) {
      notify({ title: 'Nombre muy corto', message: 'Usa al menos 2 caracteres.', variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('groups').insert({ owner_id: myId, name });
      if (error) throw error;
      setNewName('');
      setCreating(false);
      await load();
    } catch (error) {
      notify({ title: 'No se pudo crear el grupo', message: error.message || 'Intenta de nuevo.', variant: 'error' });
    } finally {
      setSaving(false);
    }
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
      <SubScreenHeader title="Grupos" onBack={onBack} />

      {creating ? (
        <View style={styles.createCard}>
          <TextInput
            style={styles.createInput}
            placeholder="Nombre del grupo"
            placeholderTextColor={colors.placeholder}
            value={newName}
            onChangeText={setNewName}
            autoFocus
            accessibilityLabel="Nombre del grupo"
          />
          <View style={styles.createActions}>
            <TouchableOpacity style={styles.textButton} onPress={() => { setCreating(false); setNewName(''); }} accessibilityRole="button" accessibilityLabel="Cancelar">
              <Text style={styles.textButtonLabel}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={createGroup} disabled={saving} accessibilityRole="button" accessibilityLabel="Crear grupo">
              {saving ? <ActivityIndicator size="small" color={colors.background} /> : <Text style={styles.saveButtonText}>Crear</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Hoverable scaleTo={1.01}>
          {({ hovered }) => (
            <TouchableOpacity
              style={[styles.newGroupButton, hovered && styles.newGroupButtonHovered]}
              onPress={() => setCreating(true)}
              accessibilityRole="button"
              accessibilityLabel="Crear grupo"
            >
              <Ionicons name="add-circle-outline" size={19} color={colors.primary} />
              <Text style={styles.newGroupText}>Crear grupo</Text>
            </TouchableOpacity>
          )}
        </Hoverable>
      )}

      {groups.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBadge}>
            <Ionicons name="people-circle-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Todavía no tienes grupos</Text>
          <Text style={styles.emptyBody}>Crea uno y agrega miembros desde tu lista de amigos.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {groups.map((g) => {
            const count = g.group_members?.length || 0;
            return (
              <Hoverable key={g.id} scaleTo={1.01}>
                {({ hovered }) => (
                  <TouchableOpacity
                    style={[styles.row, hovered && styles.rowHovered]}
                    onPress={() => onOpenGroup(g.id, g.name)}
                    accessibilityRole="button"
                    accessibilityLabel={g.name}
                  >
                    <LinearGradient
                      colors={[darken(colors.primary, 0.3), colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.groupIcon}
                    >
                      <Ionicons name="people" size={18} color={colors.background} />
                    </LinearGradient>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowLabel}>{g.name}</Text>
                      <Text style={styles.rowSub}>{count} {count === 1 ? 'miembro' : 'miembros'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                  </TouchableOpacity>
                )}
              </Hoverable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  newGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  newGroupButtonHovered: { backgroundColor: colors.primarySoft },
  newGroupText: { color: colors.primary, fontSize: 14.5, fontWeight: '700' },

  createCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 20, gap: 12 },
  createInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  createActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  textButtonLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  saveButton: { minHeight: 44, minWidth: 100, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  saveButtonText: { color: colors.background, fontSize: 14, fontWeight: '700' },

  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    minHeight: 68,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowHovered: { borderColor: colors.primary, shadowOpacity: 0.1 },
  groupIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTextCol: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 28, borderRadius: 20, backgroundColor: colors.surfaceMuted },
  emptyIconBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: 15, fontFamily: FONT_DISPLAY, color: colors.text },
  emptyBody: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 30, lineHeight: 17 },
});
