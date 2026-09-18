// Factores de actividad y de estres para el calculo de GET, separados
// de tmbFormulas.js porque son especificos del paso de GET (no del TMB).

// Si el paciente esta hospitalizado, el factor de actividad no depende
// del sexo, depende de que tanto se mueve en la cama/sala.
export const HOSPITAL_ACTIVITY_FACTORS = [
  { key: 'noSeLevanta', label: 'No se levanta', value: 1.1 },
  { key: 'encamado', label: 'Encamado', value: 1.2 },
  { key: 'ambulatorio', label: 'Ambulatorio', value: 1.3 },
];

// Si no esta hospitalizado, el factor de actividad si depende del sexo.
export const NON_HOSPITAL_ACTIVITY_FACTORS = {
  M: [
    { key: 'sedentario', label: 'Sedentario', value: 1.3 },
    { key: 'leve', label: 'Leve', value: 1.6 },
    { key: 'moderada', label: 'Moderada', value: 1.78 },
    { key: 'activa', label: 'Activa', value: 2.1 },
  ],
  F: [
    { key: 'sedentario', label: 'Sedentario', value: 1.3 },
    { key: 'leve', label: 'Leve', value: 1.5 },
    { key: 'moderada', label: 'Moderada', value: 1.64 },
    { key: 'activa', label: 'Activa', value: 1.82 },
  ],
};

export const getActivityOptions = (hospitalized, sex) => (hospitalized ? HOSPITAL_ACTIVITY_FACTORS : NON_HOSPITAL_ACTIVITY_FACTORS[sex]);

// Factor de estres por patologia: multiplica al GET (TMB x actividad x estres).
// Donde la fuente daba mas de un valor para la misma patologia sin
// distinguir por que (ej. severidad), se dejan como opciones sueltas en
// vez de inventar etiquetas de "leve/moderado/severo" que no venian dadas.
export const STRESS_FACTORS = [
  { key: 'noAplica', label: 'No aplica', options: [{ value: 1, label: 'No aplica' }] },
  { key: 'fiebre', label: 'Fiebre (>37°C)', options: [{ value: 1.2, label: '1.2' }] },
  { key: 'cirugiaMayor', label: 'Cirugía mayor', options: [{ value: 1.2, label: '1.2' }, { value: 1.3, label: '1.3' }] },
  { key: 'neumonia', label: 'Neumonía', options: [{ value: 1.2, label: '1.2' }] },
  { key: 'cancer', label: 'Cáncer', options: [{ value: 1.2, label: '1.2' }, { value: 1.3, label: '1.3' }, { value: 1.4, label: '1.4' }] },
  { key: 'sepsis', label: 'Sepsis', options: [1.2, 1.3, 1.4, 1.5, 1.6].map((v) => ({ value: v, label: String(v) })) },
  { key: 'traumatismo', label: 'Traumatismo', options: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8].map((v) => ({ value: v, label: String(v) })) },
  { key: 'hepatologia', label: 'Hepatología', options: [{ value: 1.3, label: '1.3' }] },
];

export const getStressCategory = (key) => STRESS_FACTORS.find((s) => s.key === key) || STRESS_FACTORS[0];
