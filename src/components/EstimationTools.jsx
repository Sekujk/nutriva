import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { FONT_DISPLAY, FONT_DISPLAY_BOLD } from '../theme/typography';
import useResponsive from '../hooks/useResponsive';
import {
  computeRabitoWeight,
  getAgeWeightFormula,
  computeAgeWeight,
  LIMB_PERCENTAGES,
  computeLimbAdjustment,
  computeChumleaHeight,
  computeChumleaHeightNoLowerLimb,
} from '../data/estimationFormulas';

const parseNum = (str) => {
  const n = parseFloat(String(str).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const TOOLS = [
  { key: 'rabito', label: 'Peso (Rabito)', icon: 'body-outline' },
  { key: 'ageWeight', label: 'Peso (por edad)', icon: 'calendar-outline' },
  { key: 'limb', label: 'Ajuste por amputación', icon: 'cut-outline' },
  { key: 'chumlea', label: 'Talla (Chumlea)', icon: 'resize-outline' },
];

function NumberField({ label, value, onChangeText, placeholder, colors, styles }) {
  return (
    <View style={styles.fieldCol}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        accessibilityLabel={label}
      />
    </View>
  );
}

function ResultBar({ value, unit, onApply, applyLabel, colors, styles }) {
  if (value === null) return null;
  return (
    <View style={styles.resultBar}>
      <View>
        <Text style={styles.resultValue}>{value.toFixed(1)}</Text>
        <Text style={styles.resultUnit}>{unit}</Text>
      </View>
      <TouchableOpacity style={styles.applyButton} onPress={() => onApply(value)} accessibilityRole="button" accessibilityLabel={applyLabel}>
        <Ionicons name="checkmark" size={15} color={colors.background} />
        <Text style={styles.applyButtonText}>{applyLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function EstimationTools({ visible, onClose, sex, age, onApplyWeight, onApplyHeight }) {
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [tool, setTool] = useState('rabito');

  // Rabito
  const [rCmb, setRCmb] = useState('');
  const [rPab, setRPab] = useState('');
  const [rPp, setRPp] = useState('');

  // Peso por edad
  const [awAr, setAwAr] = useState('');
  const [awCmb, setAwCmb] = useState('');

  // Ajuste por amputacion
  const [limbWeight, setLimbWeight] = useState('');
  const [limbKey, setLimbKey] = useState(LIMB_PERCENTAGES[0].key);
  const [limbDirection, setLimbDirection] = useState('subtract');

  // Chumlea
  const [chAr, setChAr] = useState('');
  const [chNoLowerLimb, setChNoLowerLimb] = useState(false);
  const [chArmSpan, setChArmSpan] = useState('');

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

  if (!visible) return null;

  const rabitoResult = parseNum(rCmb) > 0 && parseNum(rPab) > 0 && parseNum(rPp) > 0
    ? computeRabitoWeight(sex, parseNum(rCmb), parseNum(rPab), parseNum(rPp))
    : null;

  const ageFormula = age > 0 ? getAgeWeightFormula(sex, age) : null;
  const ageWeightResult = ageFormula && parseNum(awAr) > 0 && parseNum(awCmb) > 0
    ? computeAgeWeight(ageFormula, parseNum(awAr), parseNum(awCmb))
    : null;

  const limbPercentEntry = LIMB_PERCENTAGES.find((l) => l.key === limbKey);
  const limbResult = parseNum(limbWeight) > 0
    ? computeLimbAdjustment(parseNum(limbWeight), limbPercentEntry.percent, limbDirection)
    : null;

  const chumleaResult = age > 0 && !chNoLowerLimb && parseNum(chAr) > 0
    ? computeChumleaHeight(sex, age, parseNum(chAr))
    : age > 0 && chNoLowerLimb && parseNum(chArmSpan) > 0
      ? computeChumleaHeightNoLowerLimb(sex, age, parseNum(chArmSpan))
      : null;

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
            <Text style={styles.headerTitle}>Estimar peso o talla</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.toolTabs}>
            {TOOLS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.toolTab, tool === t.key && styles.toolTabActive]}
                onPress={() => setTool(t.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: tool === t.key }}
                accessibilityLabel={t.label}
              >
                <Ionicons name={t.icon} size={14} color={tool === t.key ? colors.background : colors.textMuted} />
                <Text style={[styles.toolTabText, tool === t.key && styles.toolTabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {tool === 'rabito' && (
              <>
                <Text style={styles.toolHint}>
                  Estima el peso de un paciente hospitalizado que no se puede pesar directamente.
                </Text>
                <View style={styles.fieldRow}>
                  <NumberField label="CMB (cm)" value={rCmb} onChangeText={setRCmb} placeholder="25" colors={colors} styles={styles} />
                  <NumberField label="PAB (mm)" value={rPab} onChangeText={setRPab} placeholder="12" colors={colors} styles={styles} />
                  <NumberField label="PP (cm)" value={rPp} onChangeText={setRPp} placeholder="32" colors={colors} styles={styles} />
                </View>
                <ResultBar value={rabitoResult} unit="kg estimados" onApply={onApplyWeight} applyLabel="Usar como peso" colors={colors} styles={styles} />
              </>
            )}

            {tool === 'ageWeight' && (
              <>
                <Text style={styles.toolHint}>
                  Otra forma de estimar el peso, a partir de altura de rodilla y CMB. Usa la edad ya ingresada en la calculadora.
                </Text>
                {!ageFormula && (
                  <Text style={styles.toolWarning}>Ingresa la edad del paciente en la calculadora primero (válido de 6 a 80 años).</Text>
                )}
                <View style={styles.fieldRow}>
                  <NumberField label="Altura de rodilla (cm)" value={awAr} onChangeText={setAwAr} placeholder="45" colors={colors} styles={styles} />
                  <NumberField label="CMB (cm)" value={awCmb} onChangeText={setAwCmb} placeholder="25" colors={colors} styles={styles} />
                </View>
                {ageFormula && (
                  <Text style={styles.toolHint}>Margen de referencia: ± {ageFormula.margin} kg</Text>
                )}
                <ResultBar value={ageWeightResult} unit="kg estimados" onApply={onApplyWeight} applyLabel="Usar como peso" colors={colors} styles={styles} />
              </>
            )}

            {tool === 'limb' && (
              <>
                <Text style={styles.toolHint}>
                  Ajusta el peso sumando o restando el % correspondiente a una extremidad. Usa "Restar" para saber el peso sin la extremidad, y "Sumar" para estimar el peso previo a una amputación.
                </Text>
                <NumberField label="Peso (kg)" value={limbWeight} onChangeText={setLimbWeight} placeholder="70" colors={colors} styles={styles} />

                <Text style={styles.fieldLabel}>Extremidad</Text>
                <View style={styles.chipsWrap}>
                  {LIMB_PERCENTAGES.map((l) => (
                    <TouchableOpacity
                      key={l.key}
                      style={[styles.chip, limbKey === l.key && styles.chipActive]}
                      onPress={() => setLimbKey(l.key)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: limbKey === l.key }}
                      accessibilityLabel={`${l.label}, ${l.percent}%`}
                    >
                      <Text style={[styles.chipText, limbKey === l.key && styles.chipTextActive]}>{l.label} ({l.percent}%)</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>¿Sumar o restar?</Text>
                <View style={styles.sexRow}>
                  <TouchableOpacity
                    style={[styles.sexButton, limbDirection === 'subtract' && styles.sexButtonActive]}
                    onPress={() => setLimbDirection('subtract')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: limbDirection === 'subtract' }}
                    accessibilityLabel="Restar (peso sin la extremidad)"
                  >
                    <Text style={[styles.sexButtonText, limbDirection === 'subtract' && styles.sexButtonTextActive]}>Restar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sexButton, limbDirection === 'add' && styles.sexButtonActive]}
                    onPress={() => setLimbDirection('add')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: limbDirection === 'add' }}
                    accessibilityLabel="Sumar (peso previo a la amputación)"
                  >
                    <Text style={[styles.sexButtonText, limbDirection === 'add' && styles.sexButtonTextActive]}>Sumar</Text>
                  </TouchableOpacity>
                </View>

                <ResultBar value={limbResult} unit="kg" onApply={onApplyWeight} applyLabel="Usar como peso" colors={colors} styles={styles} />
              </>
            )}

            {tool === 'chumlea' && (
              <>
                <Text style={styles.toolHint}>
                  Estima la talla a partir de la altura de rodilla. Usa la edad ya ingresada en la calculadora.
                </Text>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setChNoLowerLimb((v) => !v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: chNoLowerLimb }}
                  accessibilityLabel="Paciente sin extremidad inferior"
                >
                  <View style={[styles.checkbox, chNoLowerLimb && styles.checkboxChecked]}>
                    {chNoLowerLimb && <Ionicons name="checkmark" size={13} color={colors.background} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Paciente sin extremidad inferior (usa longitud de brazada)</Text>
                </TouchableOpacity>

                {!(age > 0) && (
                  <Text style={styles.toolWarning}>Ingresa la edad del paciente en la calculadora primero.</Text>
                )}

                {chNoLowerLimb ? (
                  <NumberField label="Longitud de brazada (cm)" value={chArmSpan} onChangeText={setChArmSpan} placeholder="170" colors={colors} styles={styles} />
                ) : (
                  <NumberField label="Altura de rodilla (cm)" value={chAr} onChangeText={setChAr} placeholder="45" colors={colors} styles={styles} />
                )}

                <ResultBar value={chumleaResult} unit="cm estimados" onApply={onApplyHeight} applyLabel="Usar como talla" colors={colors} styles={styles} />
              </>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
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
    maxWidth: 520,
    borderRadius: 24,
    maxHeight: '85%',
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

  toolTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 16, paddingBottom: 8 },
  toolTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
  },
  toolTabActive: { backgroundColor: colors.primary },
  toolTabText: { fontSize: 11.5, fontWeight: '600', color: colors.textMuted },
  toolTabTextActive: { color: colors.background },

  body: { padding: 20, paddingTop: 4, gap: 10 },
  toolHint: { fontSize: 12.5, color: colors.textMuted, lineHeight: 18, marginBottom: 6 },
  toolWarning: { fontSize: 12, color: colors.warning, marginBottom: 6 },

  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldCol: { flex: 1 },
  fieldLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 44,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.primarySoft },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  chipTextActive: { color: colors.background },

  sexRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  sexButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sexButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sexButtonText: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  sexButtonTextActive: { color: colors.background },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { fontSize: 12.5, color: colors.text, flex: 1 },

  resultBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  resultValue: { fontSize: 24, fontFamily: FONT_DISPLAY_BOLD, color: colors.primary },
  resultUnit: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  applyButtonText: { fontSize: 12.5, fontWeight: '700', color: colors.background },
});
