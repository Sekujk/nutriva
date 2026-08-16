import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../../theme/ThemeContext';
import { FONT_DISPLAY, FONT_DISPLAY_ITALIC } from '../../theme/typography';
import SubScreenHeader from './SubScreenHeader';
import Hoverable from '../../components/Hoverable';

const GITHUB_URL = 'https://github.com/Sekujk/nutriva';

export default function AboutScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const version = Constants.expoConfig?.version || '—';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SubScreenHeader title="Sobre la app" onBack={onBack} />

      <View style={styles.card}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconEmoji}>🦦</Text>
        </View>
        <Text style={styles.version}>Nutriva v{version}</Text>
        <Text style={styles.body}>
          Calculadoras clínicas y composición de alimentos para estudiantes de nutrición en Perú y Guatemala.
        </Text>
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
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconEmoji: { fontSize: 28, lineHeight: 32 },
  version: { fontSize: 17, fontFamily: FONT_DISPLAY, color: colors.text },
  body: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },

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
