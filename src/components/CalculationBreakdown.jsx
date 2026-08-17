import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { FONT_DISPLAY, FONT_DISPLAY_BOLD } from '../theme/typography';
import { getFormula } from '../data/tmbFormulas';

function fmt(n) {
  return Number.isFinite(n) ? Math.round(n) : '—';
}

function CountUp({ target, duration = 900, style }) {
  const [value, setValue] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!Number.isFinite(target)) return undefined;
    anim.setValue(0);
    setValue(0);
    const listenerId = anim.addListener(({ value: v }) => setValue(Math.round(v)));
    Animated.timing(anim, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listenerId);
  }, [target, duration]);

  return <Text style={style}>{Number.isFinite(target) ? value : '—'}</Text>;
}

function RevealRow({ index, children, delay = 60 }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 260,
      delay: index * delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

const SEX_LABEL = { M: 'Hombre', F: 'Mujer' };

export default function CalculationBreakdown({ visible, onClose, calc }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(40)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    overlayOpacity.setValue(0);
    sheetY.setValue(40);
    sheetOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 90 }),
    ]).start();
  }, [visible]);

  if (!visible || !calc) return null;

  const hasPatientData = calc.weight != null && calc.height != null && calc.age != null && !!calc.sex;
  const formula = hasPatientData ? getFormula(calc.formula_key) : null;
  const stepPair = hasPatientData ? formula.steps(calc.sex, calc.weight, calc.height, calc.age) : null;

  const rows = [];
  if (hasPatientData) {
    rows.push(
      { label: 'Sexo', value: SEX_LABEL[calc.sex] || calc.sex },
      { label: 'Peso', value: `${calc.weight} kg` },
      { label: 'Talla', value: `${calc.height} cm` },
      { label: 'Edad', value: `${calc.age} años` },
    );
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={styles.overlayPress} onPress={onClose} />
        <Animated.View style={[styles.sheet, { opacity: sheetOpacity, transform: [{ translateY: sheetY }] }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Cómo se calculó</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {rows.length > 0 && (
              <View style={styles.tableCard}>
                <Text style={styles.cardEyebrow}>Datos del caso</Text>
                {rows.map((row, i) => (
                  <RevealRow key={row.label} index={i}>
                    <View style={[styles.tableRow, i === rows.length - 1 && styles.tableRowLast]}>
                      <Text style={styles.tableLabel}>{row.label}</Text>
                      <Text style={styles.tableValue}>{row.value}</Text>
                    </View>
                  </RevealRow>
                ))}
              </View>
            )}

            <RevealRow index={rows.length}>
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultIcon}>
                    <Ionicons name="flame" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.resultTitle}>TMB · {calc.formula_label || 'Mifflin-St Jeor'}</Text>
                </View>
                {stepPair && (
                  <>
                    <Text style={styles.stepGeneric}>{stepPair[0]}</Text>
                    <Text style={styles.stepSubstituted}>{stepPair[1]}</Text>
                  </>
                )}
                <View style={styles.resultValueRow}>
                  <CountUp target={calc.tmb} style={styles.resultValue} />
                  <Text style={styles.resultUnit}>kcal/día</Text>
                </View>
              </View>
            </RevealRow>

            <RevealRow index={rows.length + 1}>
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultIcon}>
                    <Ionicons name="flash" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.resultTitle}>GET · Gasto Energético Total</Text>
                </View>
                <Text style={styles.stepGeneric}>TMB × factor de actividad</Text>
                <Text style={styles.stepSubstituted}>
                  {fmt(calc.tmb)} × {calc.activity_factor ?? '?'} {calc.activity_label ? `(${calc.activity_label})` : ''}
                </Text>
                <View style={styles.resultValueRow}>
                  <CountUp target={calc.get} style={styles.resultValue} />
                  <Text style={styles.resultUnit}>kcal/día</Text>
                </View>
              </View>
            </RevealRow>

            {!hasPatientData && (
              <Text style={styles.legacyNote}>
                Este caso se compartió antes de guardar los datos del paciente, así que no podemos mostrar el detalle completo.
              </Text>
            )}
          </ScrollView>
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
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontFamily: FONT_DISPLAY, color: colors.text },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },

  body: { padding: 20, gap: 14 },

  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tableLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  tableValue: { fontSize: 13.5, color: colors.text, fontWeight: '700' },

  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  resultIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text, flexShrink: 1 },
  stepGeneric: { fontSize: 12, color: colors.textFaint, fontStyle: 'italic' },
  stepSubstituted: { fontSize: 13, color: colors.textMuted, marginTop: 3, fontWeight: '600' },
  resultValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 12 },
  resultValue: { fontSize: 30, fontFamily: FONT_DISPLAY_BOLD, color: colors.primary },
  resultUnit: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },

  legacyNote: { fontSize: 12, color: colors.textFaint, textAlign: 'center', paddingVertical: 8, lineHeight: 17 },
});
