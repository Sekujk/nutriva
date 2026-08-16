import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../../theme/ThemeContext';
import { FONT_DISPLAY, FONT_DISPLAY_ITALIC } from '../../theme/typography';
import SubScreenHeader from './SubScreenHeader';
import Hoverable from '../../components/Hoverable';
import HeroBadge from '../../components/HeroBadge';

const GITHUB_URL = 'https://github.com/Sekujk/nutriva';

const FEATURES = [
  { icon: 'calculator-outline', text: 'Calculadoras clínicas con la fórmula siempre visible' },
  { icon: 'restaurant-outline', text: 'Tablas de composición de alimentos de Perú y Guatemala' },
  { icon: 'time-outline', text: 'Historial de casos, como un cuaderno de trabajo' },
];

const SOURCES = [
  { country: 'Perú', name: 'INS — Tablas peruanas de composición de alimentos, 10ma ed. (2017)' },
  { country: 'Guatemala', name: 'INCAP — Tabla de composición de alimentos de Centroamérica, 2da ed. (2012)' },
];

export default function AboutScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const version = Constants.expoConfig?.version || '—';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SubScreenHeader title="Sobre la app" onBack={onBack} />

      <View style={styles.card}>
        <HeroBadge emoji="🦦" size={60} iconSize={30} />
        <Text style={styles.version}>Nutriva v{version}</Text>
        <Text style={styles.body}>
          Calculadoras clínicas y composición de alimentos para estudiantes de nutrición en Perú y Guatemala.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Qué incluye</Text>
      <View style={styles.card}>
        {FEATURES.map((f, i) => (
          <View key={f.icon} style={[styles.featureRow, i > 0 && styles.featureRowDivider]}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon} size={17} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Fuentes de datos</Text>
      <View style={styles.card}>
        {SOURCES.map((s, i) => (
          <View key={s.country} style={[styles.sourceRow, i > 0 && styles.featureRowDivider]}>
            <Text style={styles.sourceCountry}>{s.country}</Text>
            <Text style={styles.sourceName}>{s.name}</Text>
          </View>
        ))}
      </View>

      <Hoverable scaleTo={1.01}>
        {({ hovered }) => (
          <TouchableOpacity
            style={[styles.row, hovered && styles.rowHovered]}
            onPress={() => Linking.openURL(GITHUB_URL)}
            accessibilityRole="link"
            accessibilityLabel="Ver el código en GitHub"
          >
            <View style={styles.rowIcon}>
              <Ionicons name="logo-github" size={19} color={colors.primary} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowLabel}>Código en GitHub</Text>
              <Text style={styles.rowBody}>github.com/Sekujk/nutriva</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textFaint} />
          </TouchableOpacity>
        )}
      </Hoverable>

      <View style={styles.thanksCard}>
        <Text style={styles.thanksTitle}>Con cariño</Text>
        <Text style={styles.thanksBody}>
          Nutriva nació pensando en Raquel y en todas las personas que, como ella, dedican horas a
          estudiar nutrición. Gracias por probar cada versión, por la paciencia con los bugs, y por
          ser la razón por la que esta app existe.
        </Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1, gap: 12 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  version: { fontSize: 17, fontFamily: FONT_DISPLAY, color: colors.text },
  body: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
    marginLeft: 4,
  },

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', paddingVertical: 8 },
  featureRowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: 13.5, color: colors.text, fontWeight: '600', lineHeight: 19 },

  sourceRow: { width: '100%', paddingVertical: 10, gap: 3 },
  sourceCountry: { fontSize: 11.5, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  sourceName: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    minHeight: 64,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowHovered: { borderColor: colors.primary, shadowOpacity: 0.1 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextCol: { flex: 1 },
  rowLabel: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  rowBody: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  thanksCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  thanksTitle: { fontSize: 15, fontFamily: FONT_DISPLAY, color: colors.primary },
  thanksBody: { fontSize: 14, fontFamily: FONT_DISPLAY_ITALIC, color: colors.text, lineHeight: 21 },
});
