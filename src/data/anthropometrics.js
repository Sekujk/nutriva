// Calculos antropometricos derivados de peso/talla/sexo, que ya se
// capturan en la calculadora de TMB/GET. No requieren datos nuevos, asi
// que se recalculan en el momento (aqui y en CalculationBreakdown) en vez
// de guardarse aparte en la base de datos.

export const IMC_CATEGORIES = [
  { max: 18.5, label: 'Bajo peso', key: 'bajoPeso' },
  { max: 25, label: 'Normal', key: 'normal' },
  { max: 30, label: 'Sobrepeso', key: 'sobrepeso' },
  { max: 35, label: 'Obesidad I', key: 'obesidadI' },
  { max: 40, label: 'Obesidad II', key: 'obesidadII' },
  { max: Infinity, label: 'Obesidad III', key: 'obesidadIII' },
];

export const computeIMC = (weightKg, heightCm) => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

export const classifyIMC = (imc) => IMC_CATEGORIES.find((c) => imc < c.max) || IMC_CATEGORIES[IMC_CATEGORIES.length - 1];

// Peso ideal por formula de IMC (usa 24.9, el limite superior de "normal").
export const computeIdealWeightByIMC = (heightCm) => {
  const heightM = heightCm / 100;
  return heightM * heightM * 24.9;
};

// Peso ideal por formula antropometrica (valida para tallas >= 150 cm,
// que es para lo que esta pensada la formula).
export const computeIdealWeightAnthropometric = (sex, heightCm) => {
  const overBase = heightCm - 150;
  return sex === 'M' ? 48 + 1.1 * overBase : 45 + 0.9 * overBase;
};

// Peso ajustado: solo tiene sentido si el paciente tiene sobrepeso u
// obesidad (peso actual por encima del ideal).
export const computeAdjustedWeight = (actualWeightKg, idealWeightKg) => idealWeightKg + (actualWeightKg - idealWeightKg) * 0.25;

// ICC (indice cintura-cadera): distribucion de grasa, androide (cintura) vs
// ginecoide (cadera), y riesgo cardiometabolico asociado.
export const computeICC = (waistCm, hipCm) => waistCm / hipCm;

export const classifyICC = (sex, icc) => {
  const thresholds = sex === 'M' ? { low: 0.95, mid: 1 } : { low: 0.8, mid: 0.85 };
  if (icc <= thresholds.low) return { label: 'Bajo riesgo', key: 'bajo' };
  if (icc <= thresholds.mid) return { label: 'Mediano riesgo', key: 'mediano' };
  return { label: 'Alto riesgo', key: 'alto' };
};

// Riesgo cardiometabolico solo por circunferencia de cintura (no necesita
// la cadera).
export const classifyWaistRisk = (sex, waistCm) => {
  const thresholds = sex === 'M' ? { normal: 95, elevated: 101 } : { normal: 82, elevated: 87 };
  if (waistCm < thresholds.normal) return { label: 'Normal (sin riesgo)', key: 'normal' };
  if (waistCm <= thresholds.elevated) return { label: 'Riesgo elevado', key: 'elevado' };
  return { label: 'Riesgo muy elevado', key: 'muyElevado' };
};
