import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { FONT_DISPLAY, FONT_DISPLAY_BOLD } from '../theme/typography';
import { getFormula } from '../data/tmbFormulas';
import { computeIMC, classifyIMC, computeIdealWeightByIMC, computeIdealWeightAnthropometric, computeAdjustedWeight, computeICC, classifyICC, classifyWaistRisk } from '../data/anthropometrics';
import useResponsive from '../hooks/useResponsive';

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

  const imc = hasPatientData ? computeIMC(calc.weight, calc.height) : null;
  const imcCategory = imc !== null ? classifyIMC(imc) : null;
  const idealWeightByImc = hasPatientData ? computeIdealWeightByIMC(calc.height) : null;
  const idealWeightAnthro = hasPatientData && calc.height >= 150 ? computeIdealWeightAnthropometric(calc.sex, calc.height) : null;
  const showsAdjustedWeight = imcCategory && (imcCategory.key === 'sobrepeso' || imcCategory.key.startsWith('obesidad'));
  const adjustedWeight = showsAdjustedWeight ? computeAdjustedWeight(calc.weight, idealWeightByImc) : null;

  const icc = hasPatientData && calc.waist_cm > 0 && calc.hip_cm > 0 ? computeICC(calc.waist_cm, calc.hip_cm) : null;
  const iccRisk = icc !== null ? classifyICC(calc.sex, icc) : null;
  const waistRisk = hasPatientData && calc.waist_cm > 0 ? classifyWaistRisk(calc.sex, calc.waist_cm) : null;

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

            {imc !== null && (
              <RevealRow index={rows.length + 2}>
                <View style={styles.tableCard}>
                  <Text style={styles.cardEyebrow}>IMC y peso ideal</Text>

                  <View style={styles.imcRow}>
                    <View>
                      <Text style={styles.imcValue}>{imc.toFixed(1)}</Text>
                      <Text style={styles.imcUnit}>kg/m²</Text>
                    </View>
                    <View style={[styles.imcBadge, styles[`imcBadge_${imcCategory.key}`]]}>
                      <Text style={[styles.imcBadgeText, styles[`imcBadgeText_${imcCategory.key}`]]}>{imcCategory.label}</Text>
                    </View>
                  </View>

                  <View style={[styles.tableRow]}>
                    <Text style={styles.tableLabel}>Peso ideal (por IMC)</Text>
                    <Text style={styles.tableValue}>{idealWeightByImc.toFixed(1)} kg</Text>
                  </View>
                  <View style={[styles.tableRow]}>
                    <Text style={styles.tableLabel}>Peso ideal (antropométrico)</Text>
                    <Text style={styles.tableValue}>{idealWeightAnthro !== null ? `${idealWeightAnthro.toFixed(1)} kg` : 'Solo desde 150 cm'}</Text>
                  </View>
                  {showsAdjustedWeight && (
                    <View style={[styles.tableRow, styles.tableRowLast]}>
                      <Text style={styles.tableLabel}>Peso ajustado</Text>
                      <Text style={styles.tableValue}>{adjustedWeight.toFixed(1)} kg</Text>
                    </View>
                  )}
                </View>
              </RevealRow>
            )}

            {waistRisk !== null && (
              <RevealRow index={rows.length + 3}>
                <View style={styles.tableCard}>
                  <Text style={styles.cardEyebrow}>Riesgo cardiometabólico</Text>

                  {icc !== null && (
                    <View style={styles.imcRow}>
                      <View>
                        <Text style={styles.imcValue}>{icc.toFixed(2)}</Text>
                        <Text style={styles.imcUnit}>ICC</Text>
                      </View>
                      <View style={[styles.imcBadge, styles[`riskBadge_${iccRisk.key}`]]}>
                        <Text style={[styles.imcBadgeText, styles[`riskBadgeText_${iccRisk.key}`]]}>{iccRisk.label}</Text>
                      </View>
                    </View>
                  )}

                  <View style={[styles.tableRow, styles.tableRowLast]}>
                    <Text style={styles.tableLabel}>Circunferencia de cintura</Text>
                    <View style={[styles.imcBadge, styles[`riskBadge_${waistRisk.key}`]]}>
                      <Text style={[styles.imcBadgeText, styles[`riskBadgeText_${waistRisk.key}`]]}>{waistRisk.label}</Text>
                    </View>
                  </View>
                </View>
              </RevealRow>
            )}

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
  overlayDesktop: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 8,
  },
  sheetDesktop: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    maxHeight: '80%',
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

  imcRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  imcValue: { fontSize: 26, fontFamily: FONT_DISPLAY_BOLD, color: colors.text },
  imcUnit: { fontSize: 10.5, color: colors.textFaint, fontWeight: '600' },
  imcBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  imcBadgeText: { fontSize: 12.5, fontWeight: '700' },
  imcBadge_bajoPeso: { backgroundColor: colors.warningSoft },
  imcBadge_normal: { backgroundColor: colors.successSoft },
  imcBadge_sobrepeso: { backgroundColor: colors.warningSoft },
  imcBadge_obesidadI: { backgroundColor: colors.dangerSoft },
  imcBadge_obesidadII: { backgroundColor: colors.dangerSoft },
  imcBadge_obesidadIII: { backgroundColor: colors.dangerSoft },
  imcBadgeText_bajoPeso: { color: colors.warning },
  imcBadgeText_normal: { color: colors.success },
  imcBadgeText_sobrepeso: { color: colors.warning },
  imcBadgeText_obesidadI: { color: colors.danger },
  imcBadgeText_obesidadII: { color: colors.danger },
  imcBadgeText_obesidadIII: { color: colors.danger },

  riskBadge_bajo: { backgroundColor: colors.successSoft },
  riskBadge_mediano: { backgroundColor: colors.warningSoft },
  riskBadge_alto: { backgroundColor: colors.dangerSoft },
  riskBadge_normal: { backgroundColor: colors.successSoft },
  riskBadge_elevado: { backgroundColor: colors.warningSoft },
  riskBadge_muyElevado: { backgroundColor: colors.dangerSoft },
  riskBadgeText_bajo: { color: colors.success },
  riskBadgeText_mediano: { color: colors.warning },
  riskBadgeText_alto: { color: colors.danger },
  riskBadgeText_normal: { color: colors.success },
  riskBadgeText_elevado: { color: colors.warning },
  riskBadgeText_muyElevado: { color: colors.danger },
});
