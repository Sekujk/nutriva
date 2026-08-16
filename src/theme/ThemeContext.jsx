import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildColors, PALETTES, DEFAULT_PALETTE } from './colors';
import { useAuth } from '../context/AuthContext';

const MODE_STORAGE_KEY = 'nutriva:theme-mode';
const PALETTE_STORAGE_KEY = 'nutriva:theme-palette';

const isValidMode = (value) => value === 'light' || value === 'dark' || value === 'system';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { session, updateProfile } = useAuth();
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system');
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [loaded, setLoaded] = useState(false);

  const remoteMode = session?.user?.user_metadata?.theme_mode;
  const remotePalette = session?.user?.user_metadata?.theme_palette;

  useEffect(() => {
    let cancelled = false;
    const remoteModeValid = isValidMode(remoteMode);
    const remotePaletteValid = remotePalette && PALETTES[remotePalette];

    if (remoteModeValid || remotePaletteValid) {
      if (remoteModeValid) {
        setMode(remoteMode);
        AsyncStorage.setItem(MODE_STORAGE_KEY, remoteMode).catch(() => {});
      }
      if (remotePaletteValid) {
        setPalette(remotePalette);
        AsyncStorage.setItem(PALETTE_STORAGE_KEY, remotePalette).catch(() => {});
      }
      setLoaded(true);
      return () => { cancelled = true; };
    }

    Promise.all([
      AsyncStorage.getItem(MODE_STORAGE_KEY),
      AsyncStorage.getItem(PALETTE_STORAGE_KEY),
    ])
      .then(([savedMode, savedPalette]) => {
        if (cancelled) return;
        const validMode = isValidMode(savedMode);
        const validPalette = savedPalette && PALETTES[savedPalette];
        if (validMode) setMode(savedMode);
        if (validPalette) setPalette(savedPalette);

        // Migra a la cuenta una preferencia que solo vivía en este dispositivo.
        if (session && (validMode || validPalette)) {
          const updates = {};
          if (validMode) updates.theme_mode = savedMode;
          if (validPalette) updates.theme_palette = savedPalette;
          updateProfile(updates).catch(() => {});
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [session?.user?.id, remoteMode, remotePalette]);

  const setThemeMode = async (newMode) => {
    setMode(newMode);
    AsyncStorage.setItem(MODE_STORAGE_KEY, newMode).catch(() => {});
    if (session) {
      try {
        await updateProfile({ theme_mode: newMode });
      } catch (error) {
        console.error('No se pudo guardar la preferencia de tema:', error);
      }
    }
  };

  const setThemePalette = async (newPalette) => {
    setPalette(newPalette);
    AsyncStorage.setItem(PALETTE_STORAGE_KEY, newPalette).catch(() => {});
    if (session) {
      try {
        await updateProfile({ theme_palette: newPalette });
      } catch (error) {
        console.error('No se pudo guardar la paleta de color:', error);
      }
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
