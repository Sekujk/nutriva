import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import OnboardingShell from './OnboardingShell';

const FEATURES = [
  { icon: 'calculator-outline', text: 'Calculadoras clínicas con la fórmula siempre visible' },
  { icon: 'restaurant-outline', text: 'Tablas de composición de alimentos de tu país' },
  { icon: 'time-outline', text: 'Historial de tus casos, como un cuaderno de trabajo' },
];

export default function WelcomeStep({ username, onBack, onContinue, loading }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <OnboardingShell
      icon="sparkles-outline"
      title={username ? `¡Gracias, ${username}!` : '¡Gracias por unirte!'}
      subtitle="Tu cuenta en Nutriva está lista."
      step={2}
      totalSteps={3}
      onBack={onBack}
      onContinue={onContinue}
      continueLabel="Ir a la app"
      loading={loading}
    >
      <Text style={styles.body}>
        Esto es lo que vas a encontrar:
      </Text>
      <View style={styles.list}>
        {FEATURES.map((f) => (
          <View key={f.icon} style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name={f.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.rowText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}

const getStyles = (colors) => StyleSheet.create({
  body: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
  list: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600', lineHeight: 20 },
});
