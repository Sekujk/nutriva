import { useWindowDimensions } from 'react-native';

export const TABLET_BREAKPOINT = 768;
export const DESKTOP_BREAKPOINT = 1024;

export default function useResponsive() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isTablet: width >= TABLET_BREAKPOINT,
    isDesktop: width >= DESKTOP_BREAKPOINT,
  };
}
