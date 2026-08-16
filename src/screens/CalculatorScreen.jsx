import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const ACTIVITY_FACTORS = [
  { key: 'sedentario', label: 'Sedentario', value: 1.2 },
  { key: 'ligero', label: 'Actividad ligera', value: 1.375 },
  { key: 'moderado', label: 'Actividad moderada', value: 1.55 },
  { key: 'intenso', label: 'Actividad intensa', value: 1.725 },
  { key: 'muyIntenso', label: 'Muy intenso', value: 1.9 },
];

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [sex, setSex] = useState('F');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activityKey, setActivityKey] = useState('moderado');

  const w = parseFloat(weight.replace(',', '.'));
  const h = parseFloat(height.replace(',', '.'));
  const a = parseInt(age, 10);
  const activity = ACTIVITY_FACTORS.find((f) => f.key === activityKey);

  const hasInputs = w > 0 && h > 0 && a > 0;
  const tmb = hasInputs ? (sex === 'M' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161) : null;
  const get = hasInputs ? tmb * activity.value : null;

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

      <Text style={styles.sectionTitle}>Resultado</Text>
      {hasInputs ? (
        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <View style={styles.resultIcon}>
              <Ionicons name="flame" size={18} color={colors.primary} />
            </View>
            <View style={styles.resultTextCol}>
              <Text style={styles.resultLabel}>TMB (Mifflin-St Jeor)</Text>
              <Text style={styles.formula}>
                {sex === 'M'
                  ? `10×${w} + 6.25×${h} − 5×${a} + 5`
                  : `10×${w} + 6.25×${h} − 5×${a} − 161`}
              </Text>
            </View>
          </View>
          <View style={styles.resultValuePill}>
            <Text style={styles.resultValue}>{tmb.toFixed(0)} kcal/día</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.resultRow}>
            <View style={styles.resultIcon}>
              <Ionicons name="flash" size={18} color={colors.primary} />
            </View>
            <View style={styles.resultTextCol}>
              <Text style={styles.resultLabel}>GET (Gasto Energético Total)</Text>
              <Text style={styles.formula}>TMB × {activity.value} ({activity.label})</Text>
            </View>
          </View>
          <View style={styles.resultValuePill}>
            <Text style={styles.resultValue}>{get.toFixed(0)} kcal/día</Text>
          </View>
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
    borderColor: colors.borderStrong,
  },
  activityChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  activityChipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  activityChipTextActive: { color: colors.primary },
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
  resultValuePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
    marginLeft: 48,
  },
  resultValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
  },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingHorizontal: 24 },
});
