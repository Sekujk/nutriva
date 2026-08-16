import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import SubScreenHeader from './SubScreenHeader';

const THEME_MODES = [
  { key: 'system', label: 'Sistema' },
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
];

export default function AppearanceScreen({ onBack }) {
  const { colors, mode, setThemeMode, palette, setThemePalette, palettes } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SubScreenHeader title="Apariencia" onBack={onBack} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Modo</Text>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Color</Text>
        <View style={styles.swatchRow}>
          {Object.entries(palettes).map(([key, p]) => {
            const active = palette === key;
            return (
              <TouchableOpacity
                key={key}
                style={styles.swatchTouchable}
                onPress={() => setThemePalette(key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={p.label}
              >
                <View style={[styles.swatch, { backgroundColor: p.swatch }, active && styles.swatchActive]}>
                  {active && <Ionicons name="checkmark" size={18} color="#ffffff" />}
                </View>
                <Text style={styles.swatchLabel}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 12, color: colors.textMuted, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 5,
    gap: 4,
  },
  segmentButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  segmentButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  segmentTextActive: { color: colors.background },

  swatchRow: { flexDirection: 'row', justifyContent: 'space-between' },
  swatchTouchable: { alignItems: 'center', gap: 6, minWidth: 52 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: { borderColor: colors.text },
  swatchLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
});
