import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={40} color={colors.textFaint} />
      <Text style={styles.title}>Historial de cálculos</Text>
      <Text style={styles.body}>
        Próximamente: guarda tus casos como un cuaderno de trabajo, para consultarlos después.
      </Text>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: colors.background },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  body: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
