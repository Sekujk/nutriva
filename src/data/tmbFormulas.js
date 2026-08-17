export const ACTIVITY_FACTORS = [
  { key: 'sedentario', label: 'Sedentario', value: 1.2 },
  { key: 'ligero', label: 'Actividad ligera', value: 1.375 },
  { key: 'moderado', label: 'Actividad moderada', value: 1.55 },
  { key: 'intenso', label: 'Actividad intensa', value: 1.725 },
  { key: 'muyIntenso', label: 'Muy intenso', value: 1.9 },
];

export const schofieldBracket = (a) => {
  if (a < 30) return { men: [15.057, 692.2], women: [14.818, 486.6], label: '18–30 años' };
  if (a < 60) return { men: [11.472, 873.1], women: [8.126, 845.6], label: '30–60 años' };
  return { men: [11.711, 587.7], women: [9.082, 658.5], label: '60+ años' };
};

export const TMB_FORMULAS = [
  {
    key: 'mifflin',
    label: 'Mifflin-St Jeor',
    hint: 'La más usada actualmente. Buena precisión para población adulta en general.',
    compute: (sex, w, h, a) => (sex === 'M' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161),
    formula: (sex, w, h, a) => (sex === 'M'
      ? `10×${w} + 6.25×${h} − 5×${a} + 5`
      : `10×${w} + 6.25×${h} − 5×${a} − 161`),
    steps: (sex, w, h, a) => (sex === 'M'
      ? ['10 × peso + 6.25 × talla − 5 × edad + 5', `10 × ${w} + 6.25 × ${h} − 5 × ${a} + 5`]
      : ['10 × peso + 6.25 × talla − 5 × edad − 161', `10 × ${w} + 6.25 × ${h} − 5 × ${a} − 161`]),
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
    steps: (sex, w, h, a) => (sex === 'M'
      ? ['88.362 + 13.397 × peso + 4.799 × talla − 5.677 × edad', `88.362 + 13.397 × ${w} + 4.799 × ${h} − 5.677 × ${a}`]
      : ['447.593 + 9.247 × peso + 3.098 × talla − 4.330 × edad', `447.593 + 9.247 × ${w} + 3.098 × ${h} − 4.330 × ${a}`]),
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
    steps: (sex, w, h, a) => {
      if (a < 18) return ['Válida para 18 años o más', 'Válida para 18 años o más'];
      const { men, women, label } = schofieldBracket(a);
      const [coefA, coefB] = sex === 'M' ? men : women;
      return [`${coefA} × peso + ${coefB} (${label})`, `${coefA} × ${w} + ${coefB}`];
    },
  },
];

export const getFormula = (key) => TMB_FORMULAS.find((f) => f.key === key) || TMB_FORMULAS[0];
export const getActivity = (key) => ACTIVITY_FACTORS.find((f) => f.key === key) || ACTIVITY_FACTORS[2];
