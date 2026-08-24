// Formulas para estimar peso o talla cuando no se pueden medir directo
// (paciente encamado, sin poder pararse, extremidad amputada, etc).
// Se usan aparte del flujo principal: el resultado se copia a mano al
// campo de peso/talla de la calculadora, no se guarda como su propio dato.

// Ecuacion de Rabito: estima el peso de un paciente hospitalizado que no
// se puede pesar, a partir de CMB (cm), PAB = pliegue adiposo braquial
// (mm), PP = perimetro de pantorrilla (cm).
export const computeRabitoWeight = (sex, cmb, pab, pp) => {
  const sexFactor = sex === 'M' ? 1 : 2;
  return (0.5759 * cmb) + (0.5263 * pab) + (1.2452 * pp) - (4.8689 * sexFactor) - 32.9241;
};

// Otras ecuaciones de peso por rango de edad, a partir de AR = altura de
// rodilla (cm) y CMB (cm). Devuelve tambien el margen +/- de la fuente.
const AGE_WEIGHT_FORMULAS = {
  M: [
    { min: 6, max: 18, a: 0.68, b: 2.64, c: 50.08, margin: 7.82 },
    { min: 19, max: 59, a: 1.19, b: 3.21, c: 86.82, margin: 11.42 },
    { min: 60, max: 80, a: 1.10, b: 3.07, c: 75.81, margin: 11.46 },
  ],
  F: [
    { min: 6, max: 18, a: 0.68, b: 2.64, c: 50.08, margin: 7.20 },
    { min: 19, max: 59, a: 1.19, b: 3.21, c: 86.82, margin: 10.60 },
    { min: 60, max: 80, a: 1.10, b: 3.07, c: 75.81, margin: 11.42 },
  ],
};

export const getAgeWeightFormula = (sex, age) => AGE_WEIGHT_FORMULAS[sex].find((f) => age >= f.min && age <= f.max) || null;

export const computeAgeWeight = (formula, kneeHeightCm, cmbCm) => (formula.a * kneeHeightCm) + (formula.b * cmbCm) - formula.c;

// Peso previo a amputacion / ajuste por extremidad faltante.
export const LIMB_PERCENTAGES = [
  { key: 'miembroSuperiorTotal', label: 'Miembro superior total', percent: 5.4 },
  { key: 'brazo', label: 'Brazo', percent: 3.8 },
  { key: 'antebrazo', label: 'Antebrazo', percent: 1.8 },
  { key: 'mano', label: 'Mano', percent: 0.8 },
  { key: 'miembroInferiorTotal', label: 'Miembro inferior total', percent: 17.1 },
  { key: 'muslo', label: 'Muslo', percent: 10.8 },
  { key: 'pantorrilla', label: 'Pantorrilla', percent: 4.6 },
  { key: 'pie', label: 'Pie', percent: 1.7 },
];

// weightKnown: si es el peso ACTUAL de un amputado (para saber su peso
// "completo" previo, se suma), o si es el peso previo/ideal (para saber
// cuanto pesaria ya sin la extremidad, se resta) -- direction indica cual.
export const computeLimbAdjustment = (weightKg, limbPercent, direction = 'add') => {
  const amount = (weightKg * limbPercent) / 100;
  return direction === 'add' ? weightKg + amount : weightKg - amount;
};

// Ecuacion de Chumlea: estima talla (cm) a partir de AR = altura de
// rodilla (cm) y E = edad (anios).
export const computeChumleaHeight = (sex, ageYears, kneeHeightCm) => (sex === 'M'
  ? 64.19 - (0.04 * ageYears) + (2.02 * kneeHeightCm)
  : 84.88 - (0.24 * ageYears) + (1.83 * kneeHeightCm));

// Variante sin extremidad inferior: usa longitud de brazada (lb, cm) en
// vez de altura de rodilla.
export const computeChumleaHeightNoLowerLimb = (sex, ageYears, armSpanCm) => {
  const sexFactor = sex === 'M' ? 1 : 2;
  return 58.045 - (2.965 * sexFactor) - (0.07309 * ageYears) + (0.5999 * armSpanCm) + (1.094 * (armSpanCm / 2));
};
