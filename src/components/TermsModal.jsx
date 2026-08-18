import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { FONT_DISPLAY, FONT_DISPLAY_BOLD } from '../theme/typography';

const SECTIONS = [
  {
    title: 'Qué es Nutriva',
    body: 'Nutriva es una herramienta de apoyo para estudiantes de nutrición: calculadoras clínicas y tablas de composición de alimentos. No reemplaza el criterio profesional ni lo que aprendes en clase, y no es un servicio médico. Los resultados dependen de los datos que ingreses.',
  },
  {
    title: 'Tu cuenta',
    body: 'Para usar la app necesitas crear una cuenta con tu correo. Eres responsable de mantener tu contraseña segura. Puedes eliminar tu cuenta y todos tus datos en cualquier momento desde Perfil, sin tener que pedirle permiso a nadie.',
  },
  {
    title: 'Qué datos guardamos',
    body: 'Guardamos lo que ingresas para que la app funcione: tu perfil (nombre de usuario, fecha de nacimiento, país), tus cálculos guardados, tus amigos y grupos, y los mensajes que mandas dentro de un chat. No vendemos tus datos ni los compartimos con terceros para publicidad.',
  },
  {
    title: 'Amigos, grupos y chat',
    body: 'Lo que compartes con un amigo o dentro de un grupo (mensajes, alimentos o cálculos) queda visible para esas personas, no para el resto de usuarios de la app. Tú decides a quién agregas.',
  },
  {
    title: 'Cambios en la app',
    body: 'Nutriva sigue en desarrollo activo. Podemos agregar, cambiar o quitar funciones con el tiempo. Si algo importante cambia en estos términos, lo vas a poder ver aquí mismo.',
  },
];

export default function TermsModal({ visible, onClose }) {
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
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityElementsHidden importantForAccessibility="no" />
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Términos y condiciones</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner}>
            {SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Entendido">
            <Text style={styles.doneButtonText}>Entendido</Text>
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

  body: { flexGrow: 0 },
  bodyInner: { padding: 20, gap: 18 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 14, fontFamily: FONT_DISPLAY_BOLD, color: colors.primary },
  sectionBody: { fontSize: 13.5, color: colors.textMuted, lineHeight: 20 },

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
