import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function AppAlertModal({ state, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const [typedConfirmation, setTypedConfirmation] = useState('');

  const visible = !!state;

  useEffect(() => {
    if (!visible) return;
    setTypedConfirmation('');
    overlayOpacity.setValue(0);
    cardScale.setValue(0.92);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 90 }),
    ]).start();
  }, [visible]);

  if (!state) return null;

  const VARIANT_STYLES = {
    info: { icon: 'information-circle', color: colors.primary, bg: colors.primarySoft },
    success: { icon: 'checkmark-circle', color: colors.success, bg: colors.successSoft },
    warning: { icon: 'alert-circle', color: colors.warning, bg: colors.warningSoft },
    error: { icon: 'close-circle', color: colors.danger, bg: colors.dangerSoft },
  };

  const isConfirm = state.kind === 'confirm';
  const variantKey = isConfirm ? (state.destructive ? 'error' : 'info') : (state.variant || 'info');
  const variant = VARIANT_STYLES[variantKey];

  const needsTypedConfirmation = !!state.confirmationWord;
  const typedConfirmationValid = !needsTypedConfirmation
    || typedConfirmation.trim().toUpperCase() === state.confirmationWord.toUpperCase();

  const handleClose = () => onClose();
  const handleConfirm = () => {
    if (!typedConfirmationValid) return;
    onClose();
    state.onConfirm?.();
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityElementsHidden importantForAccessibility="no" />
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          <View style={[styles.iconCircle, { backgroundColor: variant.bg }]}>
            <Ionicons name={variant.icon} size={26} color={variant.color} />
          </View>
          <Text style={styles.title}>{state.title}</Text>
          {!!state.message && <Text style={styles.message}>{state.message}</Text>}

          {!!state.items && (
            <View style={styles.itemsList}>
              {state.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <View style={[styles.itemDot, { backgroundColor: variant.color }]} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {needsTypedConfirmation && (
            <View style={styles.confirmInputWrapper}>
              <Text style={styles.confirmInputHint}>
                Escribe <Text style={styles.confirmInputWord}>{state.confirmationWord}</Text> para confirmar
              </Text>
              <TextInput
                style={styles.confirmInput}
                value={typedConfirmation}
                onChangeText={setTypedConfirmation}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={state.confirmationWord}
                placeholderTextColor={colors.placeholder}
                accessibilityLabel={`Escribe ${state.confirmationWord} para confirmar`}
              />
            </View>
          )}

          {isConfirm ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.rowButton, styles.cancelButton]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={state.cancelText || 'Cancelar'}
              >
                <Text style={styles.cancelButtonText}>{state.cancelText || 'Cancelar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rowButton,
                  styles.confirmButton,
                  state.destructive && styles.confirmButtonDestructive,
                  !typedConfirmationValid && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!typedConfirmationValid}
                accessibilityRole="button"
                accessibilityLabel={state.confirmText}
                accessibilityState={{ disabled: !typedConfirmationValid }}
              >
                <Text style={styles.confirmButtonText}>{state.confirmText}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.singleButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={state.buttonText || 'Entendido'}
            >
              <Text style={styles.confirmButtonText}>{state.buttonText || 'Entendido'}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  itemsList: { width: '100%', marginTop: 16, gap: 9, alignSelf: 'stretch' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemDot: { width: 5, height: 5, borderRadius: 2.5 },
  itemText: { flex: 1, fontSize: 13.5, color: colors.text, lineHeight: 18 },

  confirmInputWrapper: { width: '100%', marginTop: 18 },
  confirmInputHint: { fontSize: 12.5, color: colors.textMuted, marginBottom: 8, textAlign: 'center' },
  confirmInputWord: { fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  confirmInput: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },

  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  rowButton: { flex: 1, minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { borderWidth: 1, borderColor: colors.border },
  cancelButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  confirmButton: { backgroundColor: colors.primary },
  confirmButtonDestructive: { backgroundColor: colors.danger },
  confirmButtonDisabled: { opacity: 0.4 },
  confirmButtonText: { color: colors.background, fontSize: 15, fontWeight: '700' },
  singleButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
});
