import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import SubScreenHeader from './SubScreenHeader';

export default function FaqScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SubScreenHeader title="Preguntas frecuentes" onBack={onBack} />

      <View style={styles.empty}>
        <View style={styles.iconBadge}>
          <Ionicons name="help-circle-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.title}>Próximamente</Text>
        <Text style={styles.body}>
          Aquí vas a encontrar respuestas a las dudas más comunes sobre las calculadoras y las tablas de alimentos de Nutriva.
        </Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 12, gap: 12 },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
