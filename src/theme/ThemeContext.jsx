import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildColors, PALETTES, DEFAULT_PALETTE } from './colors';

const MODE_STORAGE_KEY = 'nutriva:theme-mode';
const PALETTE_STORAGE_KEY = 'nutriva:theme-palette';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system');
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(MODE_STORAGE_KEY),
      AsyncStorage.getItem(PALETTE_STORAGE_KEY),
    ])
      .then(([savedMode, savedPalette]) => {
        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
          setMode(savedMode);
        }
        if (savedPalette && PALETTES[savedPalette]) {
          setPalette(savedPalette);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const setThemeMode = async (newMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(MODE_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('No se pudo guardar la preferencia de tema:', error);
    }
  };

  const setThemePalette = async (newPalette) => {
    setPalette(newPalette);
    try {
      await AsyncStorage.setItem(PALETTE_STORAGE_KEY, newPalette);
    } catch (error) {
      console.error('No se pudo guardar la paleta de color:', error);
    }
  };

  const resolvedScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const colors = buildColors(resolvedScheme, palette);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{ mode, setThemeMode, palette, setThemePalette, palettes: PALETTES, resolvedScheme, colors }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
