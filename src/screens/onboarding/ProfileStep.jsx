import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import OnboardingShell from './OnboardingShell';

export default function ProfileStep({
  username, onChangeUsername,
  day, onChangeDay,
  month, onChangeMonth,
  year, onChangeYear,
  onContinue, continueDisabled,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <OnboardingShell
      icon="person-outline"
      title="Cuéntanos de ti"
      subtitle="Esto nos ayuda a personalizar tu experiencia en Nutriva."
      step={0}
      totalSteps={3}
      onBack={null}
      onContinue={onContinue}
      continueDisabled={continueDisabled}
    >
      <Text style={styles.label}>Nombre de usuario</Text>
      <View style={styles.fieldWrapper}>
        <Ionicons name="at-outline" size={19} color={colors.textMuted} style={styles.fieldIcon} />
        <TextInput
          style={[styles.input, styles.inputWithIcon]}
          placeholder="maria_nutri"
          placeholderTextColor={colors.placeholder}
          value={username}
          onChangeText={onChangeUsername}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Nombre de usuario"
        />
      </View>

      <Text style={styles.label}>Fecha de nacimiento</Text>
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, styles.dateInputSmall]}
          placeholder="DD"
          placeholderTextColor={colors.placeholder}
          value={day}
          onChangeText={onChangeDay}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel="Día de nacimiento"
        />
        <TextInput
          style={[styles.input, styles.dateInputSmall]}
          placeholder="MM"
          placeholderTextColor={colors.placeholder}
          value={month}
          onChangeText={onChangeMonth}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel="Mes de nacimiento"
        />
        <TextInput
          style={[styles.input, styles.dateInputLarge]}
          placeholder="AAAA"
          placeholderTextColor={colors.placeholder}
          value={year}
          onChangeText={onChangeYear}
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel="Año de nacimiento"
        />
      </View>
    </OnboardingShell>
  );
}

const getStyles = (colors) => StyleSheet.create({
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  fieldWrapper: { justifyContent: 'center', marginBottom: 20 },
  fieldIcon: { position: 'absolute', left: 14, zIndex: 1 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 52,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlign: 'center',
  },
  inputWithIcon: { paddingLeft: 44, textAlign: 'left' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInputSmall: { flex: 1 },
  dateInputLarge: { flex: 1.6 },
});
