import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../theme/ThemeContext';
import { useTour, useTourTarget } from '../context/TourContext';
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

const TIPS = [
  'El agua no tiene calorías, pero sostiene cada reacción metabólica del cuerpo.',
  '1 g de proteína o carbohidrato son 4 kcal. 1 g de grasa son 9 kcal. Tenlo siempre a la mano.',
  'La fibra no se digiere, pero es clave para la salud intestinal y el control glicémico.',
  'El factor de actividad multiplica la TMB para llegar al GET, nunca al revés.',
  'Cada 100 g no es lo mismo que una porción real: revisa siempre el tamaño de ración.',
  'Los micronutrientes no dan energía, pero sin ellos el metabolismo no funciona.',
  'Perú y Guatemala tienen tablas de composición de alimentos propias: los valores no se intercambian entre países.',
  'El IMC es un punto de partida, no un diagnóstico. La composición corporal cuenta la historia completa.',
  'Anota siempre la fórmula que usaste: tu "yo" de dentro de un mes te lo va a agradecer.',
  'La hidratación también es nutrición: el agua regula temperatura, transporte y digestión.',
];

function greetingForHour(hour) {
  if (hour < 6) return 'Buenas noches';
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

function ShortcutCard({ shortcut, index, onPress, colors, styles, gridStyle, tile }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const tourRef = useTourTarget(`shortcut-${shortcut.tab}`);

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
            ref={tourRef}
            style={[styles.card, tile && styles.cardTile, hovered && styles.cardHovered]}
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
              style={[styles.cardIcon, tile && styles.cardIconTile]}
            >
              <Ionicons name={shortcut.icon} size={tile ? 26 : 22} color={colors.primary} />
            </LinearGradient>

            {tile ? (
              <>
                <View style={styles.cardTileTextCol}>
                  <Text style={styles.cardTitleTile}>{shortcut.title}</Text>
                  <Text style={styles.cardBodyTile}>{shortcut.body}</Text>
                </View>
                <View style={styles.cardTileFooter}>
                  <Text style={styles.cardTileOpen}>Abrir</Text>
                  <Ionicons name="arrow-forward" size={15} color={colors.primary} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.cardTextCol}>
                  <Text style={styles.cardTitle}>{shortcut.title}</Text>
                  <Text style={styles.cardBody}>{shortcut.body}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
              </>
            )}
          </TouchableOpacity>
        )}
      </Hoverable>
    </Animated.View>
  );
}

export default function HomeScreen({ onNavigate }) {
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { isTablet, isDesktop } = useResponsive();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { notifyHomeReady } = useTour();

  const username = profile?.username;
  const hourGreeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const dailyTip = useMemo(() => TIPS[dayOfYear(new Date()) % TIPS.length], []);

  useEffect(() => {
    // Se espera a que las tarjetas terminen su animación de entrada antes de
    // medir su posición para el tour (si no, se mide a mitad de camino).
    const timer = setTimeout(() => notifyHomeReady(), 700);
    return () => clearTimeout(timer);
  }, [notifyHomeReady]);

  if (isDesktop) {
    return (
      <ScrollView contentContainerStyle={styles.desktopContainer}>
        <Text style={styles.greeting}>{username ? `${hourGreeting}, ${username}` : hourGreeting}</Text>
        <Text style={styles.subtitle}>¿Qué quieres hacer hoy?</Text>

        <View style={styles.desktopGrid}>
          {SHORTCUTS.map((s, index) => (
            <ShortcutCard
              key={s.tab}
              shortcut={s}
              index={index}
              onPress={() => onNavigate?.(s.tab)}
              colors={colors}
              styles={styles}
              gridStyle={styles.desktopCardItem}
              tile
            />
          ))}
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIconBadge}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.tipTextCol}>
            <Text style={styles.tipLabel}>Consejo del día</Text>
            <Text style={styles.tipText}>{dailyTip}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

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
  desktopContainer: { padding: 4, backgroundColor: colors.background, flexGrow: 1 },
  greeting: { fontSize: 26, fontFamily: FONT_DISPLAY, color: colors.text, letterSpacing: -0.2 },
  subtitle: { fontSize: 15, fontFamily: FONT_DISPLAY_ITALIC, color: colors.textMuted, marginTop: 4, marginBottom: 22 },
  list: { gap: 12 },
  listGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cardGridItem: { width: '48.5%' },
  desktopGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  desktopCardItem: { flex: 1 },
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
  cardTile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 24,
    minHeight: 190,
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
  cardIconTile: { width: 56, height: 56, borderRadius: 28 },
  cardTextCol: { flex: 1 },
  cardTitle: { fontSize: 16.5, fontFamily: FONT_DISPLAY, color: colors.text },
  cardBody: { fontSize: 12.5, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  cardTileTextCol: { marginTop: 18, flex: 1 },
  cardTitleTile: { fontSize: 19, fontFamily: FONT_DISPLAY, color: colors.text },
  cardBodyTile: { fontSize: 13.5, color: colors.textMuted, marginTop: 6, lineHeight: 19 },
  cardTileFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  cardTileOpen: { fontSize: 13, fontWeight: '700', color: colors.primary },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    padding: 22,
  },
  tipIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextCol: { flex: 1 },
  tipLabel: { fontSize: 11.5, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  tipText: { fontSize: 15, fontFamily: FONT_DISPLAY_ITALIC, color: colors.text, lineHeight: 22 },
});
