import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import Hoverable from '../../components/Hoverable';

const MENU_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MENU_ITEMS = [
  { key: 'perfil', icon: 'person-outline', label: 'Perfil', body: 'Tu nombre, foto y fecha de nacimiento' },
  { key: 'configuracion', icon: 'settings-outline', label: 'Configuración', body: 'País y datos de tu cuenta' },
  { key: 'apariencia', icon: 'color-palette-outline', label: 'Apariencia', body: 'Modo claro/oscuro y color de la app' },
  { key: 'faq', icon: 'help-circle-outline', label: 'Preguntas frecuentes', body: 'Dudas comunes sobre Nutriva' },
  { key: 'actualizaciones', icon: 'sparkles-outline', label: 'Actualizaciones', body: 'Versión y novedades de la app' },
];

function MenuRow({ item, index, onPress, colors, styles }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 300,
      delay: 100 + index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      <Hoverable scaleTo={1.015}>
        {({ hovered }) => (
          <TouchableOpacity
            style={[styles.row, hovered && styles.rowHovered]}
            onPress={onPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={styles.rowIcon}>
              <Ionicons name={item.icon} size={19} color={colors.primary} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowBody}>{item.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </TouchableOpacity>
        )}
      </Hoverable>
    </Animated.View>
  );
}

export default function ProfileMenuScreen({ onNavigate }) {
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const email = session?.user?.email || '';
  const username = session?.user?.user_metadata?.username || '';
  const createdAt = session?.user?.created_at ? new Date(session.user.created_at) : null;
  const memberSince = createdAt ? `${MENU_MONTHS[createdAt.getMonth()]} de ${createdAt.getFullYear()}` : '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Hoverable scaleTo={1.01}>
        {({ hovered }) => (
          <TouchableOpacity
            style={[styles.header, hovered && styles.headerHovered]}
            onPress={() => onNavigate('perfil')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Ver perfil"
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{(username[0] || email[0] || '?').toUpperCase()}</Text>
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.username}>{username || email}</Text>
              {!!username && <Text style={styles.email}>{email}</Text>}
              {!!memberSince && <Text style={styles.memberSince}>Miembro desde {memberSince}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </TouchableOpacity>
        )}
      </Hoverable>

      <View style={styles.list}>
        {MENU_ITEMS.map((item, index) => (
          <MenuRow
            key={item.key}
            item={item}
            index={index}
            onPress={() => onNavigate(item.key)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  headerHovered: { borderColor: colors.primary, shadowOpacity: 0.12 },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: colors.primary },
  headerTextCol: { flex: 1 },
  username: { fontSize: 16, fontWeight: '800', color: colors.text },
  email: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
  memberSince: { fontSize: 11, color: colors.textFaint, marginTop: 3, fontWeight: '600' },

  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    minHeight: 68,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextCol: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowBody: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
