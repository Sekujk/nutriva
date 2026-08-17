import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAppAlert } from '../context/AppAlertContext';
import { supabase } from '../config/supabase';
import useResponsive from '../hooks/useResponsive';
import { FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_DISPLAY_ITALIC } from '../theme/typography';

const ACTIVITY_FACTORS = [
  { key: 'sedentario', label: 'Sedentario', value: 1.2 },
  { key: 'ligero', label: 'Actividad ligera', value: 1.375 },
  { key: 'moderado', label: 'Actividad moderada', value: 1.55 },
  { key: 'intenso', label: 'Actividad intensa', value: 1.725 },
  { key: 'muyIntenso', label: 'Muy intenso', value: 1.9 },
];

const schofieldBracket = (a) => {
  if (a < 30) return { men: [15.057, 692.2], women: [14.818, 486.6], label: '18–30 años' };
  if (a < 60) return { men: [11.472, 873.1], women: [8.126, 845.6], label: '30–60 años' };
  return { men: [11.711, 587.7], women: [9.082, 658.5], label: '60+ años' };
};

const TMB_FORMULAS = [
  {
    key: 'mifflin',
    label: 'Mifflin-St Jeor',
    hint: 'La más usada actualmente. Buena precisión para población adulta en general.',
    compute: (sex, w, h, a) => (sex === 'M' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161),
    formula: (sex, w, h, a) => (sex === 'M'
      ? `10×${w} + 6.25×${h} − 5×${a} + 5`
      : `10×${w} + 6.25×${h} − 5×${a} − 161`),
  },
  {
    key: 'harrisBenedict',
    label: 'Harris-Benedict',
    hint: 'Fórmula clásica, revisada en 1984. Suele dar un valor algo más alto que Mifflin-St Jeor.',
    compute: (sex, w, h, a) => (sex === 'M'
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
      : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a),
    formula: (sex, w, h, a) => (sex === 'M'
      ? `88.362 + 13.397×${w} + 4.799×${h} − 5.677×${a}`
      : `447.593 + 9.247×${w} + 3.098×${h} − 4.330×${a}`),
  },
  {
    key: 'schofield',
    label: 'Schofield (OMS/FAO)',
    hint: 'Adoptada por la OMS y la FAO. Usa el peso según el tramo de edad; solo para adultos.',
    note: 'Válida para 18 años o más.',
    compute: (sex, w, h, a) => {
      if (a < 18) return null;
      const { men, women } = schofieldBracket(a);
      const [coefA, coefB] = sex === 'M' ? men : women;
      return coefA * w + coefB;
    },
    formula: (sex, w, h, a) => {
      if (a < 18) return 'Válida para 18 años o más';
      const { men, women, label } = schofieldBracket(a);
      const [coefA, coefB] = sex === 'M' ? men : women;
      return `${coefA}×${w} + ${coefB} (${label})`;
    },
  },
];

const parseNum = (str) => {
  const n = parseFloat(String(str).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

function StepHeader({ number, icon, title, colors, styles }) {
  return (
    <View style={styles.stepHeader}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{number}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Ionicons name={icon} size={17} color={colors.textFaint} style={styles.stepIcon} />
    </View>
  );
}

function EditableResultRow({ icon, label, formula, value, unit, override, onChangeOverride, onReset, colors, styles }) {
  return (
    <View>
      <View style={styles.resultRow}>
        <View style={styles.resultIcon}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.resultTextCol}>
          <Text style={styles.resultLabel}>{label}</Text>
          <Text style={styles.formula}>{formula}</Text>
        </View>
        {override !== null && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={onReset}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Restaurar valor calculado de ${label}`}
          >
            <Ionicons name="refresh" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.resultValueRow}>
        <TextInput
          style={[styles.resultValueInput, override !== null && styles.resultValueInputOverridden]}
          value={override !== null ? override : (value !== null ? String(Math.round(value)) : '')}
          onChangeText={onChangeOverride}
          keyboardType="decimal-pad"
          accessibilityLabel={`Valor de ${label}, editable`}
        />
        <Text style={styles.resultUnit}>{unit}</Text>
      </View>
      {override !== null && <Text style={styles.overrideHint}>Editado manualmente. Así se usa para lo que depende de este valor.</Text>}
    </View>
  );
}

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { notify } = useAppAlert();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [sex, setSex] = useState('F');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activityKey, setActivityKey] = useState('moderado');
  const [formulaKey, setFormulaKey] = useState('mifflin');
  const [tmbOverride, setTmbOverride] = useState(null);
  const [getOverride, setGetOverride] = useState(null);
  const [saving, setSaving] = useState(false);

  const w = parseNum(weight);
  const h = parseNum(height);
  const a = parseInt(age, 10);
  const activity = ACTIVITY_FACTORS.find((f) => f.key === activityKey);
  const formula = TMB_FORMULAS.find((f) => f.key === formulaKey);

  const hasInputs = w > 0 && h > 0 && a > 0;
  const autoTmb = hasInputs ? formula.compute(sex, w, h, a) : null;
  const tmb = tmbOverride !== null && tmbOverride !== '' ? parseNum(tmbOverride) : autoTmb;

  const autoGet = tmb !== null ? tmb * activity.value : null;
  const get = getOverride !== null && getOverride !== '' ? parseNum(getOverride) : autoGet;

  const handleSave = async () => {
    if (!hasInputs || tmb === null || get === null) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('calculations').insert({
        user_id: session.user.id,
        sex,
        weight: w,
        height: h,
        age: a,
        activity_key: activityKey,
        activity_label: activity.label,
        activity_factor: activity.value,
        formula_key: formulaKey,
        formula_label: formula.label,
        tmb,
        get,
      });
      if (error) throw error;
      notify({ title: 'Caso guardado', message: 'Lo vas a encontrar en tu Historial.', variant: 'success' });
    } catch (error) {
      notify({ title: 'No se pudo guardar', message: error.message || 'Intenta de nuevo.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const formContent = (
    <>
      <View style={styles.stepCard}>
        <StepHeader number="1" icon="person-outline" title="Paciente" colors={colors} styles={styles} />

        <View style={styles.sexRow}>
          {[{ key: 'F', label: 'Mujer', icon: 'female' }, { key: 'M', label: 'Hombre', icon: 'male' }].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sexButton, sex === opt.key && styles.sexButtonActive]}
              onPress={() => setSex(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: sex === opt.key }}
              accessibilityLabel={opt.label}
            >
              <Ionicons name={opt.icon} size={16} color={sex === opt.key ? colors.background : colors.textMuted} />
              <Text style={[styles.sexButtonText, sex === opt.key && styles.sexButtonTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              placeholder="70"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Peso en kilogramos"
            />
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Talla (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={height}
              onChangeText={setHeight}
              placeholder="165"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Talla en centimetros"
            />
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Edad</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              placeholder="22"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Edad en años"
            />
          </View>
        </View>
      </View>

      <View style={styles.stepCard}>
        <StepHeader number="2" icon="flame-outline" title="Fórmula de TMB" colors={colors} styles={styles} />

        <View style={styles.chipsWrap}>
          {TMB_FORMULAS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, formulaKey === f.key && styles.chipActive]}
              onPress={() => setFormulaKey(f.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: formulaKey === f.key }}
              accessibilityLabel={f.label}
            >
              <Text style={[styles.chipText, formulaKey === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.hintCard}>
          <Ionicons name="bulb-outline" size={14} color={colors.primary} style={styles.hintIcon} />
          <Text style={styles.hintText}>{formula.hint}</Text>
        </View>
        {!!formula.note && hasInputs && a < 18 && (
          <Text style={styles.formulaWarning}>{formula.note}</Text>
        )}
      </View>

      <View style={styles.stepCard}>
        <StepHeader number="3" icon="walk-outline" title="Nivel de actividad" colors={colors} styles={styles} />

        <View style={styles.chipsWrap}>
          {ACTIVITY_FACTORS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, activityKey === f.key && styles.chipActive]}
              onPress={() => setActivityKey(f.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activityKey === f.key }}
              accessibilityLabel={f.label}
            >
              <Text style={[styles.chipText, activityKey === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const resultContent = (
    <>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Resultado</Text>
        <View style={styles.editableBadge}>
          <Ionicons name="create-outline" size={12} color={colors.primary} />
          <Text style={styles.editableBadgeText}>Editable</Text>
        </View>
      </View>
      {hasInputs ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultExplainer}>
            <Text style={styles.resultExplainerEmphasis}>TMB</Text> es lo que tu cuerpo gasta solo por estar vivo, en reposo.{' '}
            <Text style={styles.resultExplainerEmphasis}>GET</Text> es tu gasto total del día, sumando tu nivel de actividad.
          </Text>

          <EditableResultRow
            icon="flame"
            label={`TMB (${formula.label})`}
            formula={formula.formula(sex, w, h, a)}
            value={autoTmb}
            unit="kcal/día"
            override={tmbOverride}
            onChangeOverride={setTmbOverride}
            onReset={() => setTmbOverride(null)}
            colors={colors}
            styles={styles}
          />

          <View style={styles.divider} />

          <EditableResultRow
            icon="flash"
            label="GET (Gasto Energético Total)"
            formula={`TMB × ${activity.value} (${activity.label})`}
            value={autoGet}
            unit="kcal/día"
            override={getOverride}
            onChangeOverride={setGetOverride}
            onReset={() => setGetOverride(null)}
            colors={colors}
            styles={styles}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Guardar en historial"
          >
            {saving ? <ActivityIndicator color={colors.background} /> : (
              <>
                <Ionicons name="bookmark-outline" size={17} color={colors.background} />
                <Text style={styles.saveButtonText}>Guardar en historial</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="calculator-outline" size={28} color={colors.textFaint} />
          <Text style={styles.empty}>Completa peso, talla y edad para ver el cálculo.</Text>
        </View>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <ScrollView contentContainerStyle={styles.desktopContainer}>
        <View style={styles.desktopRow}>
          <View style={styles.desktopCol}>{formContent}</View>
          <View style={[styles.desktopCol, styles.desktopResultCol]}>{resultContent}</View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {formContent}
      {resultContent}
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1, gap: 14 },
  desktopContainer: { padding: 4, backgroundColor: colors.background, flexGrow: 1 },
  desktopRow: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  desktopCol: { flex: 1, gap: 14 },
  desktopResultCol: { position: 'sticky', top: 20 },

  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { fontSize: 12, fontWeight: '800', color: colors.background },
  stepTitle: { flex: 1, fontSize: 15, fontFamily: FONT_DISPLAY, color: colors.text },
  stepIcon: { opacity: 0.7 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },
  editableBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },

  sexRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  sexButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  sexButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  sexButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  sexButtonTextActive: { color: colors.background },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputCol: { flex: 1 },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.primarySoft,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  chipTextActive: { color: colors.background },

  hintCard: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  hintIcon: { marginTop: 1 },
  hintText: { flex: 1, fontSize: 12.5, color: colors.primary, lineHeight: 17 },
  formulaWarning: { fontSize: 11.5, color: colors.warning, marginTop: 8, marginLeft: 2 },

  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  resultExplainer: {
    fontSize: 13,
    fontFamily: FONT_DISPLAY_ITALIC,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultExplainerEmphasis: { color: colors.primary },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTextCol: { flex: 1 },
  resultLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  formula: { fontSize: 13, color: colors.textFaint, marginTop: 2, fontStyle: 'italic' },
  resetButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginLeft: 48,
  },
  resultValueInput: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 22,
    fontFamily: FONT_DISPLAY_BOLD,
    color: colors.primary,
    minWidth: 90,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  resultValueInputOverridden: { borderColor: colors.primary },
  resultUnit: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  overrideHint: { fontSize: 11, color: colors.textFaint, marginTop: 6, marginLeft: 48, lineHeight: 15 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 50,
    marginTop: 20,
  },
  saveButtonText: { color: colors.background, fontSize: 15, fontWeight: '700' },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
  },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingHorizontal: 24 },
});
