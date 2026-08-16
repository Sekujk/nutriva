import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAppAlert } from '../context/AppAlertContext';
import { supabase } from '../config/supabase';

const ACTIVITY_FACTORS = [
  { key: 'sedentario', label: 'Sedentario', value: 1.2 },
  { key: 'ligero', label: 'Actividad ligera', value: 1.375 },
  { key: 'moderado', label: 'Actividad moderada', value: 1.55 },
  { key: 'intenso', label: 'Actividad intensa', value: 1.725 },
  { key: 'muyIntenso', label: 'Muy intenso', value: 1.9 },
];

const parseNum = (str) => {
  const n = parseFloat(String(str).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

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
      {override !== null && <Text style={styles.overrideHint}>Editado manualmente — así se usa para lo que depende de este valor.</Text>}
    </View>
  );
}

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { notify } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [sex, setSex] = useState('F');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activityKey, setActivityKey] = useState('moderado');
  const [tmbOverride, setTmbOverride] = useState(null);
  const [getOverride, setGetOverride] = useState(null);
  const [saving, setSaving] = useState(false);

  const w = parseNum(weight);
  const h = parseNum(height);
  const a = parseInt(age, 10);
  const activity = ACTIVITY_FACTORS.find((f) => f.key === activityKey);

  const hasInputs = w > 0 && h > 0 && a > 0;
  const autoTmb = hasInputs ? (sex === 'M' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161) : null;
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Datos</Text>

      <View style={styles.sexRow}>
        {[{ key: 'F', label: 'Mujer' }, { key: 'M', label: 'Hombre' }].map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sexButton, sex === opt.key && styles.sexButtonActive]}
            onPress={() => setSex(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: sex === opt.key }}
            accessibilityLabel={opt.label}
          >
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

      <Text style={styles.label}>Factor de actividad</Text>
      <View style={styles.activityWrap}>
        {ACTIVITY_FACTORS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.activityChip, activityKey === f.key && styles.activityChipActive]}
            onPress={() => setActivityKey(f.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: activityKey === f.key }}
            accessibilityLabel={f.label}
          >
            <Text style={[styles.activityChipText, activityKey === f.key && styles.activityChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Resultado</Text>
        <View style={styles.editableBadge}>
          <Ionicons name="create-outline" size={12} color={colors.primary} />
          <Text style={styles.editableBadgeText}>Editable</Text>
        </View>
      </View>
      {hasInputs ? (
        <View style={styles.resultCard}>
          <EditableResultRow
            icon="flame"
            label="TMB (Mifflin-St Jeor)"
            formula={sex === 'M'
              ? `10×${w} + 6.25×${h} − 5×${a} + 5`
              : `10×${w} + 6.25×${h} − 5×${a} − 161`}
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
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
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
  sexRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  sexButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
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
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
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
    backgroundColor: colors.surface,
  },
  activityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  activityChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.primarySoft,
  },
  activityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  activityChipText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  activityChipTextActive: { color: colors.background },
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
    fontWeight: '800',
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
