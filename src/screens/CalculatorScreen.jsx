import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAppAlert } from '../context/AppAlertContext';
import { supabase } from '../config/supabase';
import useResponsive from '../hooks/useResponsive';
import { FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_DISPLAY_ITALIC } from '../theme/typography';
import { TMB_FORMULAS } from '../data/tmbFormulas';
import { computeIMC, classifyIMC, computeIdealWeightByIMC, computeIdealWeightAnthropometric, computeAdjustedWeight, computeICC, classifyICC, classifyWaistRisk } from '../data/anthropometrics';
import { getActivityOptions, STRESS_FACTORS, getStressCategory } from '../data/getFactors';
import { getIdealCMB, getCMBAdjustment, computeAdjustedCMB, computePercentCMB, classifyCMBPercent } from '../data/cmb';
import EstimationTools from '../components/EstimationTools';

const parseNum = (str) => {
  const n = parseFloat(String(str).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const MAIN_TABS = [
  { key: 'paciente', label: 'Paciente', icon: 'person-outline' },
  { key: 'energia', label: 'Energía', icon: 'flame-outline' },
  { key: 'composicion', label: 'Composición', icon: 'body-outline' },
];

const SUB_TABS = [
  { key: 'imc', label: 'IMC' },
  { key: 'riesgo', label: 'Riesgo' },
  { key: 'cmb', label: '%CMB' },
];

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

function Hint({ children, colors, styles }) {
  return (
    <View style={styles.hintCard}>
      <Ionicons name="bulb-outline" size={14} color={colors.primary} style={styles.hintIcon} />
      <Text style={styles.hintText}>{children}</Text>
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

function TabBar({ tabs, activeKey, onChange, size, colors, styles }) {
  return (
    <View style={size === 'sub' ? styles.subTabRow : styles.mainTabRow}>
      {tabs.map((t) => {
        const active = activeKey === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={[size === 'sub' ? styles.subTabButton : styles.mainTabButton, active && (size === 'sub' ? styles.subTabButtonActive : styles.mainTabButtonActive)]}
            onPress={() => onChange(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t.label}
          >
            {t.icon && <Ionicons name={t.icon} size={15} color={active ? colors.background : colors.textMuted} />}
            <Text style={[size === 'sub' ? styles.subTabText : styles.mainTabText, active && (size === 'sub' ? styles.subTabTextActive : styles.mainTabTextActive)]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TwoCol({ left, right, isDesktop, styles }) {
  if (isDesktop) {
    return (
      <View style={styles.desktopRow}>
        <View style={styles.desktopCol}>{left}</View>
        <View style={[styles.desktopCol, styles.desktopResultCol]}>{right}</View>
      </View>
    );
  }
  return <>{left}{right}</>;
}

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { notify } = useAppAlert();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState('paciente');
  const [activeSubTab, setActiveSubTab] = useState('imc');

  const [sex, setSex] = useState('F');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [cmb, setCmb] = useState('');
  const [estimatorVisible, setEstimatorVisible] = useState(false);
  const [hospitalized, setHospitalized] = useState(false);
  const [activityKey, setActivityKey] = useState('moderada');
  const [stressKey, setStressKey] = useState('noAplica');
  const [stressValue, setStressValue] = useState(1);
  const [formulaKey, setFormulaKey] = useState('mifflin');
  const [tmbOverride, setTmbOverride] = useState(null);
  const [getOverride, setGetOverride] = useState(null);
  const [saving, setSaving] = useState(false);

  const w = parseNum(weight);
  const h = parseNum(height);
  const a = parseInt(age, 10);
  const activityOptions = getActivityOptions(hospitalized, sex);
  const activity = activityOptions.find((f) => f.key === activityKey) || activityOptions[0];
  const stressCategory = getStressCategory(stressKey);
  const formula = TMB_FORMULAS.find((f) => f.key === formulaKey);

  const hasInputs = w > 0 && h > 0 && a > 0;
  const autoTmb = hasInputs ? formula.compute(sex, w, h, a) : null;
  const tmb = tmbOverride !== null && tmbOverride !== '' ? parseNum(tmbOverride) : autoTmb;

  const autoGet = tmb !== null ? tmb * activity.value * stressValue : null;
  const get = getOverride !== null && getOverride !== '' ? parseNum(getOverride) : autoGet;
  const kcalPerKg = get !== null && w > 0 ? get / w : null;

  // Cambiar sexo u hospitalizacion cambia la lista de opciones de
  // actividad disponible, asi que el key elegido puede dejar de existir.
  const handleSetSex = (nextSex) => {
    setSex(nextSex);
    setActivityKey(getActivityOptions(hospitalized, nextSex)[0].key);
  };

  const handleSetHospitalized = (nextHospitalized) => {
    setHospitalized(nextHospitalized);
    setActivityKey(getActivityOptions(nextHospitalized, sex)[0].key);
  };

  const handleSetStressCategory = (key) => {
    setStressKey(key);
    setStressValue(getStressCategory(key).options[0].value);
  };

  const imc = w > 0 && h > 0 ? computeIMC(w, h) : null;
  const imcCategory = imc !== null ? classifyIMC(imc) : null;
  const idealWeightByImc = h > 0 ? computeIdealWeightByIMC(h) : null;
  const idealWeightAnthro = h >= 150 ? computeIdealWeightAnthropometric(sex, h) : null;
  const showsAdjustedWeight = imcCategory && (imcCategory.key === 'sobrepeso' || imcCategory.key.startsWith('obesidad'));
  const adjustedWeight = showsAdjustedWeight && w > 0 && idealWeightByImc !== null ? computeAdjustedWeight(w, idealWeightByImc) : null;

  const waistCm = parseNum(waist);
  const hipCm = parseNum(hip);
  const icc = waistCm > 0 && hipCm > 0 ? computeICC(waistCm, hipCm) : null;
  const iccRisk = icc !== null ? classifyICC(sex, icc) : null;
  const waistRisk = waistCm > 0 ? classifyWaistRisk(sex, waistCm) : null;

  const cmbCm = parseNum(cmb);
  const cmbIdeal = a > 0 ? getIdealCMB(a, sex) : null;
  const cmbAdjustmentCm = imcCategory ? getCMBAdjustment(imcCategory.key, sex, hospitalized) : 0;
  const cmbAdjusted = cmbCm > 0 ? computeAdjustedCMB(cmbCm, cmbAdjustmentCm) : null;
  const cmbPercent = cmbAdjusted !== null && cmbIdeal ? computePercentCMB(cmbAdjusted, cmbIdeal) : null;
  const cmbInterpretation = cmbPercent !== null ? classifyCMBPercent(cmbPercent) : null;

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
        waist_cm: waistCm > 0 ? waistCm : null,
        hip_cm: hipCm > 0 ? hipCm : null,
        cmb_cm: cmbCm > 0 ? cmbCm : null,
        hospitalized,
        activity_key: activityKey,
        activity_label: activity.label,
        activity_factor: activity.value,
        stress_key: stressKey,
        stress_factor: stressValue,
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

  const goToPaciente = () => setActiveTab('paciente');

  const emptyPrompt = (message) => (
    <View style={styles.emptyCard}>
      <Ionicons name="arrow-back-outline" size={22} color={colors.textFaint} />
      <Text style={styles.empty}>{message}</Text>
      <TouchableOpacity style={styles.emptyCta} onPress={goToPaciente} accessibilityRole="button" accessibilityLabel="Ir a la pestaña Paciente">
        <Text style={styles.emptyCtaText}>Ir a Paciente</Text>
      </TouchableOpacity>
    </View>
  );

  const pacienteTab = (
    <View style={styles.tabContentCentered}>
      <View style={styles.stepCard}>
        <StepHeader number="1" icon="person-outline" title="Datos del paciente" colors={colors} styles={styles} />

        <View style={styles.sexRow}>
          {[{ key: 'F', label: 'Mujer', icon: 'female' }, { key: 'M', label: 'Hombre', icon: 'male' }].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sexButton, sex === opt.key && styles.sexButtonActive]}
              onPress={() => handleSetSex(opt.key)}
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

        <TouchableOpacity
          style={styles.estimatorLink}
          onPress={() => setEstimatorVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="No puedo medir al paciente directo, estimar peso o talla"
        >
          <Ionicons name="calculator-outline" size={14} color={colors.primary} />
          <Text style={styles.estimatorLinkText}>¿No puedes medir al paciente directo? Estimar peso o talla</Text>
        </TouchableOpacity>
      </View>

      {hasInputs && (
        <View style={styles.pacienteReadyCard}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.pacienteReadyText}>Listo — revisa Energía y Composición para ver los cálculos.</Text>
        </View>
      )}
    </View>
  );

  const energiaForm = (
    <>
      <View style={styles.stepCard}>
        <StepHeader number="1" icon="flame-outline" title="Fórmula de TMB" colors={colors} styles={styles} />
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
              <Text style={[styles.chipText, formulaKey === f.key && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Hint colors={colors} styles={styles}>{formula.hint}</Hint>
        {!!formula.note && hasInputs && a < 18 && (
          <Text style={styles.formulaWarning}>{formula.note}</Text>
        )}
      </View>

      <View style={styles.stepCard}>
        <StepHeader number="2" icon="walk-outline" title="Nivel de actividad" colors={colors} styles={styles} />
        <Hint colors={colors} styles={styles}>
          Un paciente hospitalizado se mueve mucho menos que alguien libre en la calle, aunque "antes" fuera muy activo — por eso usa una escala de actividad distinta, que no depende del sexo.
        </Hint>
        <View style={styles.sexRow}>
          {[{ key: false, label: 'No hospitalizado' }, { key: true, label: 'Hospitalizado' }].map((opt) => (
            <TouchableOpacity
              key={String(opt.key)}
              style={[styles.sexButton, hospitalized === opt.key && styles.sexButtonActive]}
              onPress={() => handleSetHospitalized(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: hospitalized === opt.key }}
              accessibilityLabel={opt.label}
            >
              <Text style={[styles.sexButtonText, hospitalized === opt.key && styles.sexButtonTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.chipsWrap}>
          {activityOptions.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, activityKey === f.key && styles.chipActive]}
              onPress={() => setActivityKey(f.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activityKey === f.key }}
              accessibilityLabel={f.label}
            >
              <Text style={[styles.chipText, activityKey === f.key && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.stepCard}>
        <StepHeader number="3" icon="pulse-outline" title="Factor de estrés (opcional)" colors={colors} styles={styles} />
        <Hint colors={colors} styles={styles}>
          Enfrentar una enfermedad o lesión sube el gasto de energía del cuerpo por encima de lo normal. El factor de estrés ajusta el GET para reflejar ese gasto extra, según la patología.
        </Hint>
        <View style={styles.chipsWrap}>
          {STRESS_FACTORS.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.chip, stressKey === s.key && styles.chipActive]}
              onPress={() => handleSetStressCategory(s.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: stressKey === s.key }}
              accessibilityLabel={s.label}
            >
              <Text style={[styles.chipText, stressKey === s.key && styles.chipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {stressCategory.options.length > 1 && (
          <>
            <Text style={styles.optionalLabel}>Valor</Text>
            <View style={styles.chipsWrap}>
              {stressCategory.options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, stressValue === opt.value && styles.chipActive]}
                  onPress={() => setStressValue(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: stressValue === opt.value }}
                  accessibilityLabel={opt.label}
                >
                  <Text style={[styles.chipText, stressValue === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </>
  );

  const energiaResult = (
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
            formula={stressValue !== 1
              ? `TMB × ${activity.value} (${activity.label}) × ${stressValue} (${stressCategory.label})`
              : `TMB × ${activity.value} (${activity.label})`}
            value={autoGet}
            unit="kcal/día"
            override={getOverride}
            onChangeOverride={setGetOverride}
            onReset={() => setGetOverride(null)}
            colors={colors}
            styles={styles}
          />

          {kcalPerKg !== null && (
            <View style={styles.kcalKgRow}>
              <Ionicons name="scale-outline" size={14} color={colors.textMuted} />
              <Text style={styles.kcalKgText}>{kcalPerKg.toFixed(1)} kcal/kg</Text>
            </View>
          )}
        </View>
      ) : emptyPrompt('Completa peso, talla y edad en Paciente para ver el cálculo.')}
    </>
  );

  const imcSub = imc !== null ? (
    <View style={styles.anthroCard}>
      <Hint colors={colors} styles={styles}>
        El IMC clasifica el estado nutricional según peso y talla, pero no distingue masa grasa de masa muscular — por eso se complementa con el peso ideal/ajustado para decidir cuánto debería pesar el paciente.
      </Hint>

      <View style={styles.imcRow}>
        <View>
          <Text style={styles.imcValue}>{imc.toFixed(1)}</Text>
          <Text style={styles.imcUnit}>kg/m²</Text>
        </View>
        <View style={[styles.imcBadge, styles[`imcBadge_${imcCategory.key}`]]}>
          <Text style={[styles.imcBadgeText, styles[`imcBadgeText_${imcCategory.key}`]]}>{imcCategory.label}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.anthroRow}>
        <Text style={styles.anthroLabel}>Peso ideal (por IMC)</Text>
        <Text style={styles.anthroValue}>{idealWeightByImc !== null ? `${idealWeightByImc.toFixed(1)} kg` : '—'}</Text>
      </View>
      <View style={styles.anthroRow}>
        <Text style={styles.anthroLabel}>Peso ideal (antropométrico)</Text>
        <Text style={styles.anthroValue}>{idealWeightAnthro !== null ? `${idealWeightAnthro.toFixed(1)} kg` : 'Solo desde 150 cm'}</Text>
      </View>
      {showsAdjustedWeight && (
        <View style={styles.anthroRow}>
          <Text style={styles.anthroLabel}>Peso ajustado</Text>
          <Text style={styles.anthroValue}>{adjustedWeight !== null ? `${adjustedWeight.toFixed(1)} kg` : '—'}</Text>
        </View>
      )}
    </View>
  ) : emptyPrompt('Completa peso y talla en Paciente para ver el IMC.');

  const riesgoSub = (
    <View style={styles.anthroCard}>
      <Hint colors={colors} styles={styles}>
        Dos pacientes con el mismo peso pueden tener riesgos distintos según dónde acumulan grasa: más en el abdomen (androide) se asocia a más riesgo cardiometabólico que más en caderas (ginecoide), aunque el IMC sea normal.
      </Hint>

      <Text style={styles.optionalLabel}>Medidas</Text>
      <View style={styles.inputRow}>
        <View style={styles.inputCol}>
          <Text style={styles.label}>Cintura (cm)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={waist}
            onChangeText={setWaist}
            placeholder="80"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Circunferencia de cintura en centímetros"
          />
        </View>
        <View style={styles.inputCol}>
          <Text style={styles.label}>Cadera (cm)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={hip}
            onChangeText={setHip}
            placeholder="95"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Circunferencia de cadera en centímetros"
          />
        </View>
      </View>

      {waistRisk !== null ? (
        <>
          <View style={styles.divider} />
          {icc !== null && (
            <>
              <View style={styles.imcRow}>
                <View>
                  <Text style={styles.imcValue}>{icc.toFixed(2)}</Text>
                  <Text style={styles.imcUnit}>ICC</Text>
                </View>
                <View style={[styles.imcBadge, styles[`riskBadge_${iccRisk.key}`]]}>
                  <Text style={[styles.imcBadgeText, styles[`riskBadgeText_${iccRisk.key}`]]}>{iccRisk.label}</Text>
                </View>
              </View>
              <View style={styles.divider} />
            </>
          )}
          <View style={styles.anthroRow}>
            <Text style={styles.anthroLabel}>Circunferencia de cintura</Text>
            <View style={[styles.imcBadge, styles[`riskBadge_${waistRisk.key}`]]}>
              <Text style={[styles.imcBadgeText, styles[`riskBadgeText_${waistRisk.key}`]]}>{waistRisk.label}</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.anthroHintText}>Ingresa al menos la cintura para ver el riesgo.</Text>
      )}
    </View>
  );

  const cmbSub = (
    <View style={styles.anthroCard}>
      <Hint colors={colors} styles={styles}>
        La CMB estima la reserva de masa muscular (proteína somática) del paciente. Sirve para detectar desnutrición que el peso o el IMC solos no muestran, sobre todo en pacientes que retienen líquidos.
      </Hint>

      <Text style={styles.optionalLabel}>Medida</Text>
      <View style={styles.inputRow}>
        <View style={styles.inputCol}>
          <Text style={styles.label}>CMB medida (cm)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={cmb}
            onChangeText={setCmb}
            placeholder="Sin dato"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Circunferencia muscular del brazo en centímetros"
          />
        </View>
      </View>

      {cmbCm > 0 && (
        <>
          <View style={styles.divider} />
          {cmbIdeal === null ? (
            <Text style={styles.anthroHintText}>No hay valor de referencia de CMB para esta edad.</Text>
          ) : (
            <>
              {cmbAdjustmentCm !== 0 && (
                <Text style={styles.cmbAdjustmentNote}>
                  CMB ajustada por {imcCategory.label.toLowerCase()}: {cmbCm} {cmbAdjustmentCm > 0 ? '+' : ''}{cmbAdjustmentCm} = {cmbAdjusted.toFixed(1)} cm
                </Text>
              )}
              <View style={styles.imcRow}>
                <View>
                  <Text style={styles.imcValue}>{cmbPercent.toFixed(0)}%</Text>
                  <Text style={styles.imcUnit}>vs. ideal {cmbIdeal} cm</Text>
                </View>
                <View style={[styles.imcBadge, styles[`cmbBadge_${cmbInterpretation.key}`]]}>
                  <Text style={[styles.imcBadgeText, styles[`cmbBadgeText_${cmbInterpretation.key}`]]}>{cmbInterpretation.label}</Text>
                </View>
              </View>
            </>
          )}
        </>
      )}
    </View>
  );

  const estimator = (
    <EstimationTools
      visible={estimatorVisible}
      onClose={() => setEstimatorVisible(false)}
      sex={sex}
      age={a}
      onApplyWeight={(value) => { setWeight(String(Math.round(value * 10) / 10)); setEstimatorVisible(false); }}
      onApplyHeight={(value) => { setHeight(String(Math.round(value * 10) / 10)); setEstimatorVisible(false); }}
    />
  );

  const footerLabel = get !== null
    ? `GET ${Math.round(get)} kcal/día`
    : hasInputs ? 'Completa la fórmula para calcular' : 'Completa peso, talla y edad';

  return (
    <View style={styles.screen}>
      <TabBar tabs={MAIN_TABS} activeKey={activeTab} onChange={setActiveTab} size="main" colors={colors} styles={styles} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'paciente' && pacienteTab}

        {activeTab === 'energia' && (
          <View style={styles.tabContentWide}>
            <TwoCol left={energiaForm} right={energiaResult} isDesktop={isDesktop} styles={styles} />
          </View>
        )}

        {activeTab === 'composicion' && (
          <View style={styles.tabContentCentered}>
            <TabBar tabs={SUB_TABS} activeKey={activeSubTab} onChange={setActiveSubTab} size="sub" colors={colors} styles={styles} />
            {activeSubTab === 'imc' && imcSub}
            {activeSubTab === 'riesgo' && riesgoSub}
            {activeSubTab === 'cmb' && cmbSub}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Ionicons name={sex === 'M' ? 'male' : 'female'} size={15} color={colors.primary} />
          <Text style={styles.footerText} numberOfLines={1}>{footerLabel}</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, (!hasInputs || tmb === null || get === null || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasInputs || tmb === null || get === null || saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar en historial"
        >
          {saving ? <ActivityIndicator color={colors.background} /> : (
            <>
              <Ionicons name="bookmark-outline" size={16} color={colors.background} />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {estimator}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, flexGrow: 1, gap: 16 },

  tabContentCentered: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 16 },
  tabContentWide: { width: '100%' },

  desktopRow: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  desktopCol: { flex: 1, gap: 16 },
  desktopResultCol: { position: 'sticky', top: 20 },

  mainTabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mainTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  mainTabButtonActive: { backgroundColor: colors.primary },
  mainTabText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  mainTabTextActive: { color: colors.background },

  subTabRow: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  subTabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  subTabButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  subTabText: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  subTabTextActive: { color: colors.background },

  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
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

  sexRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
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
  inputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, rowGap: 16 },
  inputCol: { flexGrow: 1, flexBasis: 100, minWidth: 92 },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 8 },
  optionalLabel: { fontSize: 11.5, color: colors.textFaint, fontWeight: '600', marginBottom: 8 },
  estimatorLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  estimatorLinkText: { fontSize: 12, color: colors.primary, fontWeight: '600', flexShrink: 1 },
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

  pacienteReadyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successSoft,
    borderRadius: 14,
    padding: 14,
  },
  pacienteReadyText: { flex: 1, fontSize: 12.5, color: colors.success, fontWeight: '600' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
    padding: 14,
    marginBottom: 18,
  },
  hintIcon: { marginTop: 1 },
  hintText: { flex: 1, fontSize: 12.5, color: colors.primary, lineHeight: 17 },
  formulaWarning: { fontSize: 11.5, color: colors.warning, marginTop: 8, marginLeft: 2 },

  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
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
  kcalKgRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginLeft: 48 },
  kcalKgText: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },

  emptyCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
  },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingHorizontal: 24 },
  emptyCta: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 10, backgroundColor: colors.primary, marginTop: 4 },
  emptyCtaText: { color: colors.background, fontSize: 12.5, fontWeight: '700' },

  anthroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  anthroHintText: { fontSize: 12.5, color: colors.textFaint, textAlign: 'center', paddingVertical: 4 },
  imcRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  imcValue: { fontSize: 30, fontFamily: FONT_DISPLAY_BOLD, color: colors.text },
  imcUnit: { fontSize: 11, color: colors.textFaint, fontWeight: '600' },
  imcBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  imcBadgeText: { fontSize: 13, fontWeight: '700' },
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

  cmbAdjustmentNote: { fontSize: 11.5, color: colors.textFaint, marginBottom: 10, lineHeight: 16 },
  cmbBadge_normal: { backgroundColor: colors.successSoft },
  cmbBadge_leve: { backgroundColor: colors.warningSoft },
  cmbBadge_moderada: { backgroundColor: colors.warningSoft },
  cmbBadge_severa: { backgroundColor: colors.dangerSoft },
  cmbBadgeText_normal: { color: colors.success },
  cmbBadgeText_leve: { color: colors.warning },
  cmbBadgeText_moderada: { color: colors.warning },
  cmbBadgeText_severa: { color: colors.danger },

  anthroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 12 },
  anthroLabel: { fontSize: 13, color: colors.textMuted, flex: 1 },
  anthroValue: { fontSize: 14, fontFamily: FONT_DISPLAY_BOLD, color: colors.text },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerSummary: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { fontSize: 13, fontWeight: '700', color: colors.text, flexShrink: 1 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 46,
    paddingHorizontal: 20,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: colors.background, fontSize: 14.5, fontWeight: '700' },
});
