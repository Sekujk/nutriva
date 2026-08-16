const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const isValidBirthDate = (day, month, year) => {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!d || !m || !y) return false;
  if (y < 1900 || y > new Date().getFullYear() - 10) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

export const toBirthDateString = (day, month, year) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const parseBirthDate = (isoString) => {
  if (!isoString) return null;
  const [year, month, day] = isoString.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
};

export const formatBirthDate = (isoString) => {
  const parsed = parseBirthDate(isoString);
  if (!parsed) return '';
  return `${parsed.day} de ${MONTH_NAMES[parsed.month - 1]} de ${parsed.year}`;
};

export const calculateAge = (isoString) => {
  const parsed = parseBirthDate(isoString);
  if (!parsed) return null;
  const today = new Date();
  let age = today.getFullYear() - parsed.year;
  const beforeBirthday = (today.getMonth() + 1 < parsed.month)
    || (today.getMonth() + 1 === parsed.month && today.getDate() < parsed.day);
  if (beforeBirthday) age -= 1;
  return age;
};
