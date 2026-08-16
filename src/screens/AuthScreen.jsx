import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useAppAlert } from '../context/AppAlertContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const { notify } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      notify({ title: 'Faltan datos', message: 'Ingresa email y contraseña', variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { requiresEmailConfirmation } = await signUp(email, password);
        if (requiresEmailConfirmation) {
          notify({ title: 'Cuenta creada', message: 'Revisa tu email para confirmar la cuenta.', variant: 'success' });
        }
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      notify({ title: 'Error', message: error.message || 'No se pudo completar la acción', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.title}>Nutriva</Text>
      <Text style={styles.subtitle}>{isSignUp ? 'Crea tu cuenta' : 'Ingresa a tu cuenta'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.placeholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Email"
      />

      <View style={styles.passwordWrapper}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Contraseña"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
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

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={isSignUp ? 'Crear cuenta' : 'Ingresar'}
        accessibilityState={{ disabled: loading }}
      >
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.buttonText}>{isSignUp ? 'Crear cuenta' : 'Ingresar'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsSignUp((prev) => !prev)}
        style={styles.switchButton}
        accessibilityRole="button"
        accessibilityLabel={isSignUp ? 'Ya tienes cuenta, ingresa' : 'No tienes cuenta, regístrate'}
      >
        <Text style={styles.switchText}>
          {isSignUp ? '¿Ya tienes cuenta? Ingresa' : '¿No tienes cuenta? Regístrate'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: 4, color: colors.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    minHeight: 48,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  passwordWrapper: { justifyContent: 'center' },
  passwordInput: { paddingRight: 46 },
  eyeButton: {
    position: 'absolute',
    right: 6,
    top: 0,
    height: 48,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
  switchButton: { paddingVertical: 14, marginTop: 8 },
  switchText: { textAlign: 'center', color: colors.primary, fontSize: 14 },
});
