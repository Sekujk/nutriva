const neutralLight = {
  background: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f5f7f3',
  border: '#eef1ec',
  borderStrong: '#cfd6c9',
  text: '#152018',
  textMuted: '#5c6b5c',
  textFaint: '#8fa08c',
  placeholder: '#8fa08c',
  success: '#15803d',
  successSoft: '#e7f6ec',
  danger: '#b3261e',
  dangerSoft: '#fbe9e7',
  warning: '#b45309',
  warningSoft: '#fef3e2',
  overlay: 'rgba(0, 0, 0, 0.05)',
};

const neutralDark = {
  background: '#121317',
  surface: '#1e2128',
  surfaceMuted: '#262a32',
  border: '#32353d',
  borderStrong: '#454952',
  text: '#f2f3f5',
  textMuted: '#a8adb5',
  textFaint: '#75797e',
  placeholder: '#75797e',
  success: '#34d399',
  successSoft: '#123326',
  danger: '#f87171',
  dangerSoft: '#3a1e1e',
  warning: '#fbbf24',
  warningSoft: '#3a2a0f',
  overlay: 'rgba(255, 255, 255, 0.06)',
};

export const PALETTES = {
  green: {
    label: 'Verde',
    swatch: '#6ea184',
    light: { primary: '#5c8d72', primarySoft: '#e8f0ea' },
    dark: { primary: '#8fc4a3', primarySoft: '#1e2e24' },
  },
  pink: {
    label: 'Rosa',
    swatch: '#cb8aa4',
    light: { primary: '#c17a94', primarySoft: '#f7e6ec' },
    dark: { primary: '#e3a8bd', primarySoft: '#3a222a' },
  },
  purple: {
    label: 'Morado',
    swatch: '#9c8dd0',
    light: { primary: '#8b7bc4', primarySoft: '#ece8f7' },
    dark: { primary: '#b8abe0', primarySoft: '#2e2840' },
  },
  blue: {
    label: 'Azul',
    swatch: '#7fa3c4',
    light: { primary: '#6c93b8', primarySoft: '#e6eef5' },
    dark: { primary: '#9dc0dd', primarySoft: '#1f2f3d' },
  },
  brown: {
    label: 'Marrón',
    swatch: '#b08e6a',
    light: { primary: '#a17a55', primarySoft: '#f1e6d8' },
    dark: { primary: '#cba077', primarySoft: '#3a2e20' },
  },
};

export const DEFAULT_PALETTE = 'green';

export const buildColors = (scheme, paletteKey) => {
  const neutral = scheme === 'dark' ? neutralDark : neutralLight;
  const palette = PALETTES[paletteKey] || PALETTES[DEFAULT_PALETTE];
  return { mode: scheme, ...neutral, ...palette[scheme] };
};
