import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from './ProfileContext';

const STORAGE_KEY = 'nutriva:country';

export const COUNTRIES = [
  {
    code: 'PE',
    name: 'Perú',
    tableSource: 'INS',
    tableCitation: 'Instituto Nacional de Salud (INS), Centro Nacional de Alimentación, Nutrición y Vida Saludable. Tablas Peruanas de Composición de Alimentos, 11ª edición digital (2025).',
    tableYear: 2023,
    tableUrl: 'https://repositorio.ins.gob.pe/bitstreams/6cc030c5-daf4-4f19-9357-6910343796d9/download',
  },
  {
    code: 'GT',
    name: 'Guatemala',
    tableSource: 'INCAP',
    tableCitation: 'Instituto de Nutrición de Centro América y Panamá (INCAP). Tabla de Composición de Alimentos de Centroamérica, 2ª edición (reimpresión 2012).',
    tableYear: 2012,
    tableUrl: 'https://www.incap.int',
  },
];

const CountryContext = createContext();

export const useCountry = () => {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountry debe usarse dentro de CountryProvider');
  }
  return context;
};

export const CountryProvider = ({ children }) => {
  const { profile, updateProfile } = useProfile();
  const [country, setCountryState] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const remoteCountry = profile?.country;

  useEffect(() => {
    let cancelled = false;

    if (remoteCountry && COUNTRIES.some((c) => c.code === remoteCountry)) {
      setCountryState(remoteCountry);
      AsyncStorage.setItem(STORAGE_KEY, remoteCountry).catch(() => {});
      setLoaded(true);
      return () => { cancelled = true; };
    }

    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (cancelled) return;
        const valid = saved && COUNTRIES.some((c) => c.code === saved);
        if (valid) {
          setCountryState(saved);
          // Migra a la cuenta un país que solo vivía en este dispositivo.
          if (profile) {
            updateProfile({ country: saved }).catch(() => {});
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [profile?.id, remoteCountry]);

  const setCountry = async (code) => {
    setCountryState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
    if (profile) {
      try {
        await updateProfile({ country: code });
      } catch (error) {
        console.error('No se pudo guardar el país en la cuenta:', error);
      }
    }
  };

  if (!loaded) {
    return null;
  }

  return (
    <CountryContext.Provider value={{ country, setCountry, countries: COUNTRIES }}>
      {children}
    </CountryContext.Provider>
  );
};
