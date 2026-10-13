import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Pressable, ScrollView, Linking } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { FONT_DISPLAY, FONT_DISPLAY_BOLD } from '../theme/typography';
import { MIN_AGE, PRIVACY_POLICY_URL } from '../config/legal';

const SECTIONS = [
  {
    title: 'Qué es Nutriva',
    body: 'Nutriva es una herramienta de apoyo para estudiantes de nutrición: calculadoras clínicas y tablas de composición de alimentos. No reemplaza el criterio profesional ni lo que aprendes en clase, y no es un servicio médico.',
  },
  {
    title: 'No es consejo médico',
    body: 'Los cálculos (TMB, GET y similares) son orientativos y dependen de los datos que ingreses: pueden tener errores o no aplicar a tu caso. Nutriva no reemplaza la evaluación de un profesional de la salud ni se hace responsable por decisiones que tomes basándote únicamente en estos resultados.',
  },
  {
    title: 'Edad mínima',
    body: `Para crear una cuenta en Nutriva necesitas tener al menos ${MIN_AGE} años. Si nos damos cuenta de que una cuenta pertenece a alguien menor de esa edad, podemos suspenderla o eliminarla.`,
  },
  {
    title: 'Tu cuenta',
    body: 'Para usar la app necesitas crear una cuenta con tu correo. Eres responsable de mantener tu contraseña segura. Puedes eliminar tu cuenta y todos tus datos en cualquier momento desde Perfil, sin tener que pedirle permiso a nadie.',
  },
  {
    title: 'Qué datos guardamos',
    body: 'Guardamos lo que ingresas para que la app funcione: tu perfil (nombre de usuario, fecha de nacimiento, país), tus cálculos guardados, tus amigos y grupos, y los mensajes que mandas dentro de un chat. No vendemos tus datos ni los compartimos con terceros para publicidad. El detalle completo está en la Política de Privacidad.',
  },
  {
    title: 'Servicios externos que usamos',
    body: 'Tu cuenta y tus datos viven en Supabase (base de datos y autenticación). Para evitar registros automatizados usamos hCaptcha al crear una cuenta o iniciar sesión. Ambos procesan algunos de tus datos (como tu email o tu IP) solo para cumplir esa función.',
  },
  {
    title: 'Amigos, grupos y chat',
    body: 'Lo que compartes con un amigo o dentro de un grupo (mensajes, alimentos o cálculos) queda visible para esas personas, no para el resto de usuarios de la app. Tú decides a quién agregas. No uses el chat para acosar, amenazar o compartir contenido ilegal — podemos suspender cuentas que lo hagan.',
  },
  {
    title: 'Cambios en la app',
    body: 'Nutriva sigue en desarrollo activo. Podemos agregar, cambiar o quitar funciones con el tiempo. Si estos términos cambian de forma importante, la próxima vez que abras la app te vamos a pedir que los aceptes de nuevo antes de seguir.',
  },
];

export default function TermsModal({ visible, onClose, required = false, doneLabel = 'Entendido' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    overlayOpacity.setValue(0);
    cardScale.setValue(0.94);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 90 }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={required ? undefined : onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        {!required && (
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityElementsHidden importantForAccessibility="no" />
        )}
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Términos y condiciones</Text>
            {!required && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar">
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {required && (
            <Text style={styles.requiredNotice}>Actualizamos estos términos. Leelos y aceptalos de nuevo para seguir usando Nutriva.</Text>
          )}

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner}>
            {SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} accessibilityRole="link">
              <Text style={styles.privacyLink}>Ver Política de Privacidad completa ↗</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} onPress={onClose} accessibilityRole="button" accessibilityLabel={doneLabel}>
            <Text style={styles.doneButtonText}>{doneLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontFamily: FONT_DISPLAY, color: colors.text },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  requiredNotice: { fontSize: 12.5, color: colors.textMuted, paddingHorizontal: 20, paddingTop: 12, lineHeight: 18 },

  body: { flexGrow: 0 },
  bodyInner: { padding: 20, gap: 18 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 14, fontFamily: FONT_DISPLAY_BOLD, color: colors.primary },
  sectionBody: { fontSize: 13.5, color: colors.textMuted, lineHeight: 20 },
  privacyLink: { fontSize: 13, color: colors.primary, fontFamily: FONT_DISPLAY_BOLD, textDecorationLine: 'underline' },

  doneButton: {
    minHeight: 50,
    margin: 20,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: { color: colors.background, fontSize: 15, fontWeight: '700' },
});
