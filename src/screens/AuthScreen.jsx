import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useAppAlert } from '../context/AppAlertContext';
import Hoverable from '../components/Hoverable';
import HeroBadge from '../components/HeroBadge';
import Captcha from '../components/Captcha';
import { FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_DISPLAY_ITALIC } from '../theme/typography';
import useResponsive from '../hooks/useResponsive';
import { darken } from '../utils/color';

const FEATURES = [
  { icon: 'calculator-outline', text: 'Calculadoras clínicas con la fórmula siempre visible' },
  { icon: 'restaurant-outline', text: 'Tablas de composición de alimentos de tu país' },
  { icon: 'time-outline', text: 'Historial de tus casos, como un cuaderno de trabajo' },
];

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const { notify } = useAppAlert();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef(null);
  const captchaRef = useRef(null);
  const captchaPromiseRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const badgeScale = useRef(new Animated.Value(0.6)).current;
  const modeAnim = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 60, delay: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    modeAnim.setValue(0);
    Animated.spring(modeAnim, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }).start();
  }, [isSignUp]);

  const modeOpacity = modeAnim;
  const modeTranslateX = modeAnim.interpolate({ inputRange: [0, 1], outputRange: [isSignUp ? 24 : -24, 0] });

  const getCaptchaToken = () => new Promise((resolve, reject) => {
    captchaPromiseRef.current = { resolve, reject };
    captchaRef.current?.execute();
  });

  const handleCaptchaVerify = (token) => {
    captchaPromiseRef.current?.resolve(token);
    captchaPromiseRef.current = null;
  };

  const handleCaptchaError = () => {
    captchaPromiseRef.current?.reject(new Error('No se pudo verificar que no eres un robot. Intenta de nuevo.'));
    captchaPromiseRef.current = null;
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      notify({ title: 'Faltan datos', message: 'Ingresa email y contraseña', variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const captchaToken = await getCaptchaToken();
      if (isSignUp) {
        const { requiresEmailConfirmation } = await signUp(email, password, captchaToken);
        if (requiresEmailConfirmation) {
          notify({ title: 'Cuenta creada', message: 'Revisa tu email para confirmar la cuenta.', variant: 'success' });
        }
      } else {
        await signIn(email, password, captchaToken);
      }
    } catch (error) {
      notify({ title: 'Error', message: error.message || 'No se pudo completar la acción', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formFields = (
    <>
      <Captcha ref={captchaRef} onVerify={handleCaptchaVerify} onError={handleCaptchaError} />

      <Animated.Text
        style={[styles.formTitle, { opacity: modeOpacity, transform: [{ translateX: modeTranslateX }] }]}
      >
        {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
      </Animated.Text>

      <View style={styles.fieldWrapper}>
        <Ionicons name="mail-outline" size={19} color={colors.textMuted} style={styles.fieldIcon} />
        <TextInput
          style={[styles.input, styles.inputWithIcon]}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          blurOnSubmit={false}
          accessibilityLabel="Email"
        />
      </View>

      <View style={styles.fieldWrapper}>
        <Ionicons name="lock-closed-outline" size={19} color={colors.textMuted} style={styles.fieldIcon} />
        <TextInput
          ref={passwordRef}
          style={[styles.input, styles.inputWithIcon, styles.passwordInput]}
          placeholder="Contraseña"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          accessibilityLabel="Contraseña"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword((prev) => !prev)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Hoverable scaleTo={1.015}>
        {({ hovered }) => (
          <TouchableOpacity
            style={[styles.button, hovered && styles.buttonHovered]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Crear cuenta' : 'Ingresar'}
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Animated.View style={[styles.buttonContent, { opacity: modeOpacity }]}>
                <Text style={styles.buttonText}>{isSignUp ? 'Crear cuenta' : 'Ingresar'}</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.background} style={styles.buttonIcon} />
              </Animated.View>
            )}
          </TouchableOpacity>
        )}
      </Hoverable>

      <Hoverable scaleTo={1.04}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUp((prev) => !prev)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={isSignUp ? 'Ya tienes cuenta, inicia sesión' : 'No tienes cuenta, regístrate'}
        >
          <Animated.Text style={[styles.switchText, { opacity: modeOpacity }]}>
            {isSignUp ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <Text style={styles.switchTextAccent}>{isSignUp ? 'Inicia sesión' : 'Regístrate'}</Text>
          </Animated.Text>
        </TouchableOpacity>
      </Hoverable>
    </>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>
        <View style={styles.desktopBrandPanel}>
          <LinearGradient
            colors={[darken(colors.primary, 0.45), colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.blobLarge, { backgroundColor: colors.background, opacity: 0.06 }]} />
          <View style={[styles.blobSmall, { backgroundColor: colors.background, opacity: 0.08 }]} />

          <Animated.View style={{ transform: [{ scale: badgeScale }], marginBottom: 22 }}>
            <HeroBadge emoji="🦦" size={64} iconSize={32} />
          </Animated.View>

          <Text style={styles.desktopEyebrow}>Nutriva</Text>
          <Text style={styles.desktopHeadline}>
            Tu compañera de{'\n'}
            <Text style={styles.desktopHeadlineItalic}>cálculos clínicos</Text>
          </Text>

          <View style={styles.desktopFeatureList}>
            {FEATURES.map((f) => (
              <View style={styles.desktopFeatureRow} key={f.icon}>
                <View style={styles.desktopFeatureIcon}>
                  <Ionicons name={f.icon} size={17} color={colors.background} />
                </View>
                <Text style={styles.desktopFeatureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.desktopFormPanel}
          contentContainerStyle={styles.desktopFormPanelInner}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.desktopFormCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {formFields}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.hero}>
          <View style={[styles.blobLarge, { backgroundColor: colors.primarySoft, opacity: 0.5 }]} />
          <View style={[styles.blobSmall, { backgroundColor: colors.background, opacity: 0.1 }]} />

          <Animated.View style={{ transform: [{ scale: badgeScale }], marginBottom: 14 }}>
            <HeroBadge emoji="🦦" size={72} iconSize={36} />
          </Animated.View>

          <Text style={styles.heroTitle}>Nutriva</Text>
          <Text style={styles.heroTagline}>
            Cálculos clínicos y composición de alimentos para estudiantes de nutrición
          </Text>
        </View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {formFields}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },

  hero: {
    backgroundColor: colors.primary,
    paddingTop: 72,
    paddingBottom: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  blobLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -60,
  },
  blobSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    bottom: -50,
    left: -40,
  },
  heroTitle: {
    fontSize: 34,
    fontFamily: FONT_DISPLAY_BOLD,
    color: colors.background,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  heroTagline: {
    fontSize: 14.5,
    lineHeight: 21,
    fontFamily: FONT_DISPLAY_ITALIC,
    color: colors.background,
    opacity: 0.92,
    textAlign: 'center',
    maxWidth: 300,
  },

  card: {
    flexGrow: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },

  // Escritorio: panel de marca + panel de formulario lado a lado.
  desktopRoot: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  desktopBrandPanel: {
    width: 440,
    padding: 48,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  desktopEyebrow: {
    fontSize: 13,
    fontFamily: FONT_DISPLAY,
    color: colors.background,
    opacity: 0.75,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  desktopHeadline: {
    fontSize: 36,
    fontFamily: FONT_DISPLAY_BOLD,
    color: colors.background,
    lineHeight: 42,
    letterSpacing: -0.4,
    marginBottom: 36,
  },
  desktopHeadlineItalic: { fontFamily: FONT_DISPLAY_ITALIC, fontWeight: 'normal' },
  desktopFeatureList: { gap: 18 },
  desktopFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  desktopFeatureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopFeatureText: { flex: 1, fontSize: 14, color: colors.background, opacity: 0.92, lineHeight: 20, fontWeight: '600' },

  desktopFormPanel: { flex: 1 },
  desktopFormPanelInner: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  desktopFormCard: { width: '100%', maxWidth: 380 },

  formTitle: {
    fontSize: 27,
    fontFamily: FONT_DISPLAY,
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 22,
  },

  fieldWrapper: { justifyContent: 'center', marginBottom: 14 },
  fieldIcon: { position: 'absolute', left: 14, zIndex: 1 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 52,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputWithIcon: { paddingLeft: 44 },
  passwordInput: { paddingRight: 46 },
  eyeButton: {
    position: 'absolute',
    right: 6,
    top: 0,
    height: 52,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonHovered: { shadowOpacity: 0.4, shadowRadius: 14 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '700' },
  buttonIcon: { marginLeft: 8 },

  switchButton: { minHeight: 44, paddingVertical: 14, marginTop: 6, alignItems: 'center', justifyContent: 'center' },
  switchText: { textAlign: 'center', color: colors.textMuted, fontSize: 15 },
  switchTextAccent: { color: colors.primary, fontWeight: '700' },
});
