import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'nutriva:country';

export const COUNTRIES = [
  { code: 'PE', name: 'Perú', tableSource: 'INS', flag: '🇵🇪' },
  { code: 'GT', name: 'Guatemala', tableSource: 'INCAP', flag: '🇬🇹' },
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
  const { session, updateProfile } = useAuth();
  const [country, setCountryState] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const remoteCountry = session?.user?.user_metadata?.country;

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
          if (session) {
            updateProfile({ country: saved }).catch(() => {});
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [session?.user?.id, remoteCountry]);

  const setCountry = async (code) => {
    setCountryState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
    if (session) {
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
