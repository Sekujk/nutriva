import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';

const SHORTCUTS = [
  {
    tab: 'calculator',
    icon: 'calculator',
    title: 'Calculadora',
    body: 'TMB, GET y macros con la fórmula siempre a la vista.',
  },
  {
    tab: 'foods',
    icon: 'restaurant',
    title: 'Alimentos',
    body: 'Composición de alimentos según la tabla oficial de tu país.',
  },
  {
    tab: 'history',
    icon: 'time',
    title: 'Historial',
    body: 'Tus casos guardados, como un cuaderno de trabajo.',
  },
];

export default function HomeScreen({ onNavigate }) {
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const username = session?.user?.user_metadata?.username;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>{username ? `Hola, ${username}` : 'Hola de nuevo'}</Text>
      <Text style={styles.subtitle}>¿Qué quieres hacer hoy?</Text>

      <View style={styles.list}>
        {SHORTCUTS.map((s) => (
          <TouchableOpacity
            key={s.tab}
            style={styles.card}
            onPress={() => onNavigate?.(s.tab)}
            accessibilityRole="button"
            accessibilityLabel={s.title}
          >
            <View style={styles.cardIcon}>
              <Ionicons name={s.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardBody}>{s.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    minHeight: 76,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardBody: { fontSize: 12.5, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
});
