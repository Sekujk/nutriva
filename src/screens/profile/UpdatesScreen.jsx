import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../../theme/ThemeContext';
import SubScreenHeader from './SubScreenHeader';

export default function UpdatesScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const version = Constants.expoConfig?.version || '—';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SubScreenHeader title="Actualizaciones" onBack={onBack} />

      <View style={styles.card}>
        <View style={styles.iconBadge}>
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        </View>
        <Text style={styles.version}>Nutriva v{version}</Text>
        <Text style={styles.body}>Estás usando la versión más reciente.</Text>
      </View>

      <Text style={styles.footnote}>Próximamente: aquí verás el historial de cambios de cada versión.</Text>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  version: { fontSize: 17, fontWeight: '800', color: colors.text },
  body: { fontSize: 13, color: colors.textMuted },
  footnote: { fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: 16, lineHeight: 17 },
});
