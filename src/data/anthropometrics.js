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
