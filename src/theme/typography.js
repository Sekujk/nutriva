import {
  useFonts,
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';

export const FONT_DISPLAY = 'Fraunces_600SemiBold';
export const FONT_DISPLAY_BOLD = 'Fraunces_700Bold';
export const FONT_DISPLAY_ITALIC = 'Fraunces_500Medium_Italic';
export const FONT_DISPLAY_MEDIUM = 'Fraunces_500Medium';

export function useAppFonts() {
  const [loaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });
  return loaded;
}
