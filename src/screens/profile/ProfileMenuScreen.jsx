import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAppAlert } from '../../context/AppAlertContext';
import Hoverable from '../../components/Hoverable';
import Avatar from '../../components/Avatar';
import { darken, lighten } from '../../utils/color';
import { FONT_DISPLAY, FONT_DISPLAY_ITALIC } from '../../theme/typography';

const MENU_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MENU_SECTIONS = [
  {
    label: 'Cuenta',
    items: [
      { key: 'perfil', icon: 'person-outline', label: 'Perfil', body: 'Tu nombre, foto y fecha de nacimiento' },
      { key: 'configuracion', icon: 'earth-outline', label: 'País', body: 'Tabla de composición de alimentos' },
      { key: 'apariencia', icon: 'color-palette-outline', label: 'Apariencia', body: 'Modo claro/oscuro y color de la app' },
    ],
  },
  {
    label: 'Ayuda',
    items: [
      { key: 'faq', icon: 'help-circle-outline', label: 'Preguntas frecuentes', body: 'Dudas comunes sobre Nutriva' },
      { key: 'sobre', icon: 'sparkles-outline', label: 'Sobre la app', body: 'Versión, código y agradecimientos' },
    ],
  },
];

function MenuRow({ item, index, onPress, colors, styles }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 300,
      delay: 80 + index * 55,
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
            <LinearGradient
              colors={[lighten(colors.primarySoft, 0.18), colors.primarySoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rowIcon}
            >
              <Ionicons name={item.icon} size={19} color={colors.primary} />
            </LinearGradient>
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
  const { session, signOut, deleteAccount } = useAuth();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { confirm, notify } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [deleting, setDeleting] = useState(false);

  const email = session?.user?.email || '';
  const username = profile?.username || '';
  const avatarUrl = profile?.avatar_url || null;
  const createdAt = session?.user?.created_at ? new Date(session.user.created_at) : null;
  const memberSince = createdAt ? `${MENU_MONTHS[createdAt.getMonth()]} de ${createdAt.getFullYear()}` : '';

  const handleSignOut = () => {
    confirm({
      title: 'Cerrar sesión',
      message: '¿Seguro que quieres salir de tu cuenta?',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
      onConfirm: signOut,
    });
  };

  const handleDeleteAccount = () => {
    confirm({
      title: 'Eliminar cuenta',
      message: 'Esta acción es permanente y no se puede deshacer. Se borra para siempre:',
      items: [
        'Tu perfil: nombre, foto y fecha de nacimiento',
        'Todo tu historial de cálculos guardados',
        'Tu país y tus preferencias de apariencia',
        'Tu acceso a Nutriva con este correo',
      ],
      confirmText: 'Eliminar para siempre',
      cancelText: 'Cancelar',
      destructive: true,
      confirmationWord: 'ELIMINAR',
      onConfirm: async () => {
        setDeleting(true);
        try {
          await deleteAccount();
        } catch (error) {
          notify({ title: 'No se pudo eliminar la cuenta', message: error.message || 'Intenta de nuevo más tarde.', variant: 'error' });
          setDeleting(false);
        }
      },
    });
  };

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
            <LinearGradient
              colors={[darken(colors.primary, 0.3), colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <Avatar
                uri={avatarUrl}
                label={(username[0] || email[0] || '?').toUpperCase()}
                size={54}
                fontSize={21}
              />
            </LinearGradient>
            <View style={styles.headerTextCol}>
              <Text style={styles.username}>{username || email}</Text>
              {!!username && <Text style={styles.email}>{email}</Text>}
              {!!memberSince && (
                <View style={styles.memberPill}>
                  <Ionicons name="calendar-outline" size={11} color={colors.primary} />
                  <Text style={styles.memberSince}>Desde {memberSince}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </TouchableOpacity>
        )}
      </Hoverable>

      {MENU_SECTIONS.map((section) => (
        <View key={section.label} style={styles.section}>
          <Text style={styles.sectionLabel}>{section.label}</Text>
          <View style={styles.list}>
            {section.items.map((item, index) => (
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
        </View>
      ))}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signOutRow}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteLink}
          onPress={handleDeleteAccount}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel="Eliminar cuenta"
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.textFaint} />
          ) : (
            <Text style={styles.deleteLinkText}>Eliminar cuenta</Text>
          )}
        </TouchableOpacity>
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
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  headerHovered: { borderColor: colors.primary, shadowOpacity: 0.12 },
  avatarRing: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  headerTextCol: { flex: 1 },
  username: { fontSize: 17, fontFamily: FONT_DISPLAY, color: colors.text },
  email: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  memberSince: { fontSize: 10.5, color: colors.primary, fontWeight: '700' },

  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextCol: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowBody: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  footer: { marginTop: 4, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.dangerSoft,
  },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  deleteLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  deleteLinkText: { color: colors.textFaint, fontSize: 12.5, fontWeight: '600', textDecorationLine: 'underline' },
});
