import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import OnboardingShell from './OnboardingShell';
import CountryFlag from '../../components/CountryFlag';

export default function CountryStep({
  countries, selectedCode, onSelect,
  search, onChangeSearch,
  onBack, onContinue, continueDisabled,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const filtered = countries.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <OnboardingShell
      icon="earth-outline"
      title="Tu país"
      subtitle="Define qué tabla oficial de composición de alimentos vas a usar."
      step={1}
      totalSteps={3}
      onBack={onBack}
      onContinue={onContinue}
      continueDisabled={continueDisabled}
    >
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={19} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar país"
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={onChangeSearch}
          autoCapitalize="none"
          accessibilityLabel="Buscar país"
        />
      </View>

      <View style={styles.list}>
        {filtered.map((c) => {
          const active = selectedCode === c.code;
          return (
            <TouchableOpacity
              key={c.code}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => onSelect(c.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={c.name}
            >
              <CountryFlag code={c.code} size={30} />
              <View style={styles.rowTextCol}>
                <Text style={[styles.rowName, active && styles.rowNameActive]}>{c.name}</Text>
                <Text style={styles.rowSource}>Tabla {c.tableSource}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <Text style={styles.emptyText}>No encontramos ese país. Por ahora Nutriva cubre Perú y Guatemala.</Text>
        )}
      </View>
    </OnboardingShell>
  );
}

const getStyles = (colors) => StyleSheet.create({
  searchWrapper: { justifyContent: 'center', marginBottom: 18 },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingVertical: 14,
    paddingLeft: 44,
    paddingRight: 14,
    fontSize: 16,
    minHeight: 52,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    padding: 14,
    minHeight: 64,
    backgroundColor: colors.surface,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  rowTextCol: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowNameActive: { color: colors.primary },
  rowSource: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingVertical: 20 },
});
