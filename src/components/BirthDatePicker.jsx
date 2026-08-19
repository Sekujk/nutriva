import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { FONT_DISPLAY } from '../theme/typography';
import { isValidBirthDate, calculateAge } from '../utils/birthDate';
import useResponsive from '../hooks/useResponsive';

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export default function BirthDatePicker({ visible, initialDay, initialMonth, initialYear, onSave, onClose, saving }) {
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [day, setDay] = useState('');
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState('');

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(40)).current;
  const sheetScale = useRef(new Animated.Value(0.95)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setDay(initialDay || '');
    setMonth(initialMonth ? Number(initialMonth) : null);
    setYear(initialYear || '');
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

  if (!visible) return null;

  const valid = isValidBirthDate(day, month, year);
  const previewAge = valid ? calculateAge(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`) : null;

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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Fecha de nacimiento</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.numberRow}>
              <View style={styles.numberField}>
                <Text style={styles.fieldLabel}>Día</Text>
                <TextInput
                  style={styles.numberInput}
                  value={day}
                  onChangeText={(v) => setDay(v.replace(/[^0-9]/g, '').slice(0, 2))}
                  placeholder="DD"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={2}
                  accessibilityLabel="Día de nacimiento"
                />
              </View>
              <View style={styles.numberField}>
                <Text style={styles.fieldLabel}>Año</Text>
                <TextInput
                  style={styles.numberInput}
                  value={year}
                  onChangeText={(v) => setYear(v.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="AAAA"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={4}
                  accessibilityLabel="Año de nacimiento"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Mes</Text>
            <View style={styles.monthGrid}>
              {MONTHS.map((label, i) => {
                const value = i + 1;
                const selected = month === value;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.monthChip, selected && styles.monthChipSelected]}
                    onPress={() => setMonth(value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Mes ${label}`}
                  >
                    <Text style={[styles.monthChipText, selected && styles.monthChipTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.previewPill, valid && styles.previewPillActive]}>
              <Ionicons name={valid ? 'checkmark-circle' : 'calendar-outline'} size={15} color={valid ? colors.primary : colors.textFaint} />
              <Text style={[styles.previewText, valid && styles.previewTextActive]}>
                {valid ? `Tendrías ${previewAge} años` : 'Completa día, mes y año'}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancelar">
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, (!valid || saving) && styles.saveButtonDisabled]}
              onPress={() => onSave(day, month, year)}
              disabled={!valid || saving}
              accessibilityRole="button"
              accessibilityLabel="Guardar fecha de nacimiento"
            >
              {saving ? <ActivityIndicator size="small" color={colors.background} /> : <Text style={styles.saveButtonText}>Guardar</Text>}
            </TouchableOpacity>
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  sheetDesktop: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 16, fontFamily: FONT_DISPLAY, color: colors.text },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },

  body: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  fieldLabel: { fontSize: 11.5, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },

  numberRow: { flexDirection: 'row', gap: 12 },
  numberField: { flex: 1 },
  numberInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingVertical: 14,
    fontSize: 20,
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },

  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChip: {
    minWidth: 62,
    flexGrow: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  monthChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthChipText: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  monthChipTextSelected: { color: colors.background },

  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surfaceMuted,
    marginTop: 4,
  },
  previewPillActive: { backgroundColor: colors.primarySoft },
  previewText: { fontSize: 12.5, color: colors.textFaint, fontWeight: '600' },
  previewTextActive: { color: colors.primary },

  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  cancelButton: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: 14.5, fontWeight: '700', color: colors.textMuted },
  saveButton: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 14.5, fontWeight: '700', color: colors.background },
});
