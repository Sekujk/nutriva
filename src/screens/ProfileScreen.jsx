import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useCountry } from '../context/CountryContext';

const THEME_MODES = [
  { key: 'system', label: 'Sistema' },
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
];

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { colors, mode, setThemeMode } = useTheme();
  const { country, setCountry, countries } = useCountry();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const email = session?.user?.email || '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitial}>{(email[0] || '?').toUpperCase()}</Text>
      </View>
      <Text style={styles.email}>{email}</Text>

      <Text style={styles.sectionTitle}>País</Text>
      <View style={styles.segmented}>
        {countries.map((c) => {
          const active = country === c.code;
          return (
            <TouchableOpacity
              key={c.code}
              style={[styles.segmentButton, active && styles.segmentButtonActive]}
              onPress={() => setCountry(c.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={c.name}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>Define qué tabla de composición de alimentos vas a usar.</Text>

      <Text style={styles.sectionTitle}>Apariencia</Text>
      <View style={styles.segmented}>
        {THEME_MODES.map((m) => {
          const active = mode === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.segmentButton, active && styles.segmentButtonActive]}
              onPress={() => setThemeMode(m.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={m.label}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={signOut}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: colors.background, flexGrow: 1 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: colors.primary },
  email: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 14 },
  sectionTitle: {
    width: '100%',
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 32,
    marginBottom: 10,
  },
  segmented: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segmentButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  segmentButtonActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  segmentTextActive: { color: colors.background },
  hint: { width: '100%', fontSize: 12, color: colors.textMuted, marginTop: 8, lineHeight: 16 },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    marginTop: 40,
    paddingHorizontal: 16,
  },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
