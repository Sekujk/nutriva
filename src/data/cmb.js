// %CMB (circunferencia muscular del brazo): compara la CMB medida contra
// un valor ideal segun edad/sexo, con un ajuste en cm si el paciente
// tiene bajo peso, sobrepeso u obesidad (tabla de "CMB ajustado").

// CMB ideal (cm) por edad y sexo. Filas por edad puntual (12-18) o rango
// (19-74). Fuera de este rango de edad no hay dato de referencia.
const CMB_IDEAL_TABLE = [
  { min: 12, max: 12, M: 23.2, F: 23.7 },
  { min: 13, max: 13, M: 24.7, F: 24.3 },
  { min: 14, max: 14, M: 25.3, F: 25.2 },
  { min: 15, max: 15, M: 26.4, F: 25.4 },
  { min: 16, max: 16, M: 27.8, F: 25.8 },
  { min: 17, max: 17, M: 28.5, F: 26.4 },
  { min: 18, max: 18, M: 29.7, F: 25.8 },
  { min: 19, max: 24, M: 30.8, F: 26.5 },
  { min: 25, max: 34, M: 31.9, F: 27.7 },
  { min: 35, max: 44, M: 32.6, F: 29.9 },
  { min: 45, max: 54, M: 32.2, F: 29.9 },
  { min: 55, max: 64, M: 31.7, F: 30.3 },
  { min: 65, max: 74, M: 30.7, F: 29.9 },
];

export const getIdealCMB = (age, sex) => {
  const row = CMB_IDEAL_TABLE.find((r) => age >= r.min && age <= r.max);
  return row ? row[sex] : null;
};

// Ajuste en cm sobre la CMB medida, segun categoria de IMC, sexo, y si el
// paciente esta hospitalizado o no. "Obesidad I" y "Obesidad II" comparten
// fila en la fuente original.
const CMB_ADJUSTMENT_TABLE = {
  bajoPeso: { M: { hosp: 0, noHosp: 3 }, F: { hosp: 0, noHosp: 2 } },
  normal: { M: { hosp: 0, noHosp: 0 }, F: { hosp: 0, noHosp: 0 } },
  sobrepeso: { M: { hosp: -3, noHosp: -3 }, F: { hosp: -2, noHosp: -2 } },
  obesidadI: { M: { hosp: -7, noHosp: -7 }, F: { hosp: -6, noHosp: -6 } },
  obesidadII: { M: { hosp: -7, noHosp: -7 }, F: { hosp: -6, noHosp: -6 } },
  obesidadIII: { M: { hosp: -10, noHosp: -10 }, F: { hosp: -9, noHosp: -9 } },
};

export const getCMBAdjustment = (imcCategoryKey, sex, hospitalized) => {
  const row = CMB_ADJUSTMENT_TABLE[imcCategoryKey];
  if (!row) return 0;
  return hospitalized ? row[sex].hosp : row[sex].noHosp;
};

export const computeAdjustedCMB = (measuredCm, adjustmentCm) => measuredCm + adjustmentCm;

export const computePercentCMB = (adjustedCm, idealCm) => (adjustedCm / idealCm) * 100;

const CMB_INTERPRETATION = [
  { min: 90, label: 'Normal', key: 'normal' },
  { min: 81, label: 'Depleción leve de proteína somática', key: 'leve' },
  { min: 70, label: 'Depleción moderada de proteína somática', key: 'moderada' },
  { min: -Infinity, label: 'Depleción severa de proteína somática', key: 'severa' },
];

export const classifyCMBPercent = (pct) => CMB_INTERPRETATION.find((c) => pct >= c.min) || CMB_INTERPRETATION[CMB_INTERPRETATION.length - 1];
