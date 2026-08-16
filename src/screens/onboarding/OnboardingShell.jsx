import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import Hoverable from '../../components/Hoverable';
import HeroBadge from '../../components/HeroBadge';
import { FONT_DISPLAY } from '../../theme/typography';

export default function OnboardingShell({
  icon,
  title,
  subtitle,
  step,
  totalSteps,
  children,
  onBack,
  onContinue,
  continueLabel = 'Continuar',
  continueDisabled = false,
  loading = false,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={styles.hero}>
          <View style={[styles.blobLarge, { backgroundColor: colors.primarySoft, opacity: 0.5 }]} />
          <View style={[styles.blobSmall, { backgroundColor: colors.background, opacity: 0.1 }]} />

          <View style={{ marginBottom: 14 }}>
            <HeroBadge icon={icon} size={60} iconSize={26} />
          </View>
          <Text style={styles.heroTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}

          <View style={styles.dots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          {children}

          <View style={styles.footer}>
            {onBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Atrás"
              >
                <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}

            <Hoverable scaleTo={continueDisabled ? 1 : 1.02} style={styles.continueWrapper}>
              {({ hovered }) => (
                <TouchableOpacity
                  style={[styles.continueButton, hovered && !continueDisabled && styles.continueButtonHovered, continueDisabled && styles.continueButtonDisabled]}
                  onPress={onContinue}
                  disabled={continueDisabled || loading}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={continueLabel}
                  accessibilityState={{ disabled: continueDisabled || loading }}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <View style={styles.continueContent}>
                      <Text style={styles.continueText}>{continueLabel}</Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.background} style={styles.continueIcon} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </Hoverable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },

  hero: {
    backgroundColor: colors.primary,
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  blobLarge: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -85, right: -55 },
  blobSmall: { position: 'absolute', width: 130, height: 130, borderRadius: 65, bottom: -55, left: -35 },
  heroTitle: { fontSize: 27, fontFamily: FONT_DISPLAY, color: colors.background, letterSpacing: -0.2, textAlign: 'center' },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.background,
    opacity: 0.88,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 6,
  },
  dots: { flexDirection: 'row', gap: 8, marginTop: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: colors.primary, width: 22 },

  card: {
    flexGrow: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },

  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24 },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: { width: 0 },
  continueWrapper: { flex: 1 },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonHovered: { shadowOpacity: 0.4, shadowRadius: 14 },
  continueButtonDisabled: { opacity: 0.45, shadowOpacity: 0 },
  continueContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  continueText: { color: colors.background, fontSize: 16, fontWeight: '700' },
  continueIcon: { marginLeft: 8 },
});
