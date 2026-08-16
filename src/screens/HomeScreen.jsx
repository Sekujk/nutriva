import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import Hoverable from '../components/Hoverable';

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

function ShortcutCard({ shortcut, index, onPress, colors, styles }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 320,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      <Hoverable scaleTo={1.02}>
        {({ hovered }) => (
          <TouchableOpacity
            style={[styles.card, hovered && styles.cardHovered]}
            onPress={onPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={shortcut.title}
          >
            <View style={styles.cardIcon}>
              <Ionicons name={shortcut.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>{shortcut.title}</Text>
              <Text style={styles.cardBody}>{shortcut.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </TouchableOpacity>
        )}
      </Hoverable>
    </Animated.View>
  );
}

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
        {SHORTCUTS.map((s, index) => (
          <ShortcutCard
            key={s.tab}
            shortcut={s}
            index={index}
            onPress={() => onNavigate?.(s.tab)}
            colors={colors}
            styles={styles}
          />
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardHovered: {
    shadowOpacity: 0.16,
    shadowRadius: 18,
    borderColor: colors.primary,
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
