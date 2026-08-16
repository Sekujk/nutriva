import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import Hoverable from '../components/Hoverable';
import useResponsive from '../hooks/useResponsive';
import { lighten } from '../utils/color';
import { FONT_DISPLAY, FONT_DISPLAY_ITALIC } from '../theme/typography';

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

function greetingForHour(hour) {
  if (hour < 6) return 'Buenas noches';
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function ShortcutCard({ shortcut, index, onPress, colors, styles, gridStyle }) {
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
      style={[
        gridStyle,
        {
          opacity: entrance,
          transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
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
            <LinearGradient
              colors={[colors.surface, lighten(colors.primarySoft, 0.1)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[lighten(colors.primarySoft, 0.18), colors.primarySoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIcon}
            >
              <Ionicons name={shortcut.icon} size={22} color={colors.primary} />
            </LinearGradient>
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
  const { isTablet } = useResponsive();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const username = session?.user?.user_metadata?.username;
  const hourGreeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>{username ? `${hourGreeting}, ${username}` : hourGreeting}</Text>
      <Text style={styles.subtitle}>¿Qué quieres hacer hoy?</Text>

      <View style={[styles.list, isTablet && styles.listGrid]}>
        {SHORTCUTS.map((s, index) => (
          <ShortcutCard
            key={s.tab}
            shortcut={s}
            index={index}
            onPress={() => onNavigate?.(s.tab)}
            colors={colors}
            styles={styles}
            gridStyle={isTablet ? styles.cardGridItem : null}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  greeting: { fontSize: 26, fontFamily: FONT_DISPLAY, color: colors.text, letterSpacing: -0.2 },
  subtitle: { fontSize: 15, fontFamily: FONT_DISPLAY_ITALIC, color: colors.textMuted, marginTop: 4, marginBottom: 22 },
  list: { gap: 12 },
  listGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cardGridItem: { width: '48.5%' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 16,
    minHeight: 76,
    overflow: 'hidden',
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
  cardTitle: { fontSize: 16.5, fontFamily: FONT_DISPLAY, color: colors.text },
  cardBody: { fontSize: 12.5, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
});
