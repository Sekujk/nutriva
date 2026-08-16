import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nutriva:country';

export const COUNTRIES = [
  { code: 'PE', name: 'Perú', tableSource: 'INS' },
  { code: 'GT', name: 'Guatemala', tableSource: 'INCAP' },
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
  const [country, setCountryState] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && COUNTRIES.some((c) => c.code === saved)) {
          setCountryState(saved);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const setCountry = async (code) => {
    setCountryState(code);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, code);
    } catch (error) {
      console.error('No se pudo guardar el país seleccionado:', error);
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
