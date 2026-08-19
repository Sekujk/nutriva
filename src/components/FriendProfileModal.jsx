import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { FONT_DISPLAY, FONT_DISPLAY_ITALIC } from '../theme/typography';
import { darken } from '../utils/color';
import Avatar from './Avatar';
import useResponsive from '../hooks/useResponsive';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const formatSince = (iso) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
};

export default function FriendProfileModal({ visible, profile, onClose }) {
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(40)).current;
  const sheetScale = useRef(new Animated.Value(0.95)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    overlayOpacity.setValue(0);
    sheetY.setValue(40);
    sheetScale.setValue(0.95);
    sheetOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      isDesktop
        ? Animated.spring(sheetScale, { toValue: 1, useNativeDriver: true, friction: 9, tension: 90 })
        : Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 90 }),
    ]).start();
  }, [visible, isDesktop]);

  if (!visible || !profile) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, isDesktop && styles.overlayDesktop, { opacity: overlayOpacity }]}>
        <Pressable style={styles.overlayPress} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            isDesktop && styles.sheetDesktop,
            {
              opacity: sheetOpacity,
              transform: isDesktop ? [{ scale: sheetScale }] : [{ translateY: sheetY }],
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.headerBlock}>
            <LinearGradient
              colors={[darken(colors.primary, 0.3), colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <Avatar uri={profile.avatar_url} label={(profile.username?.[0] || '?').toUpperCase()} size={76} fontSize={28} />
            </LinearGradient>
            <Text style={styles.username}>
              {profile.username}
              {!!profile.tag && <Text style={styles.usernameTag}>#{profile.tag}</Text>}
            </Text>
            {!!profile.created_at && (
              <View style={styles.memberPill}>
                <Ionicons name="calendar-outline" size={11} color={colors.primary} />
                <Text style={styles.memberSince}>En Nutriva desde {formatSince(profile.created_at)}</Text>
              </View>
            )}
          </View>

          <View style={styles.bioCard}>
            {profile.bio ? (
              <Text style={styles.bioText}>{profile.bio}</Text>
            ) : (
              <Text style={styles.bioEmpty}>Todavía no escribió una descripción.</Text>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  overlayPress: { ...StyleSheet.absoluteFillObject },
  overlayDesktop: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  sheetDesktop: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 8,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },

  headerBlock: { alignItems: 'center', marginTop: -8, gap: 4 },
  avatarRing: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center' },
  username: { fontSize: 18, fontFamily: FONT_DISPLAY, color: colors.text, marginTop: 12 },
  usernameTag: { fontSize: 13, fontFamily: FONT_DISPLAY_ITALIC, color: colors.textFaint },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  memberSince: { fontSize: 11, color: colors.primary, fontWeight: '700' },

  bioCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
  },
  bioText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  bioEmpty: { fontSize: 13.5, color: colors.textFaint, fontFamily: FONT_DISPLAY_ITALIC },
});
