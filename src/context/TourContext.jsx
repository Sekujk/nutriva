import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nutriva:tour-seen';

// Cada paso apunta a una "target key" que algún componente registra con
// useTourTarget(key). El paso de bienvenida no tiene target: se muestra
// centrado, sin señalar nada.
export const TOUR_STEPS = [
  {
    key: 'welcome',
    title: '¡Bienvenido a Nutriva!',
    body: 'Un recorrido rápido por las partes principales de la app. Puedes saltarlo ahora y repetirlo cuando quieras desde tu perfil.',
    target: null,
  },
  {
    key: 'calculator',
    title: 'Calculadora',
    body: 'TMB, GET, IMC, riesgo cardiometabólico y %CMB, con la fórmula siempre visible junto al resultado.',
    target: 'shortcut-calculator',
  },
  {
    key: 'foods',
    title: 'Alimentos',
    body: 'La tabla de composición de alimentos oficial de tu país, con la fuente citada y enlazada.',
    target: 'shortcut-foods',
  },
  {
    key: 'history',
    title: 'Historial',
    body: 'Cada caso que guardes queda aquí, como un cuaderno de trabajo clínico al que puedes volver.',
    target: 'shortcut-history',
  },
  {
    key: 'nav',
    title: 'Navegación',
    body: 'Desde aquí saltas entre secciones en cualquier momento, sin perder lo que estabas haciendo.',
    target: 'nav-bar',
  },
  {
    key: 'profile',
    title: 'Tu perfil',
    body: 'Cambia tu país, apariencia o contraseña, y repite esta guía cuando quieras desde Perfil → Ayuda.',
    target: 'profile-avatar',
  },
];

const TourContext = createContext(null);

export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour debe usarse dentro de TourProvider');
  }
  return ctx;
};

// Los componentes que quieren ser "señalados" por el tour llaman a este hook
// con una key estable (ver TOUR_STEPS). Devuelve un ref para adjuntar al
// elemento real (View/TouchableOpacity) que se quiere resaltar.
export const useTourTarget = (key) => {
  const { registerTarget } = useTour();
  const ref = useRef(null);

  useEffect(() => {
    if (!key) return undefined;
    return registerTarget(key, ref);
  }, [key, registerTarget]);

  return ref;
};

export const TourProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const targets = useRef({});
  const hasSeenTourRef = useRef(true); // true por defecto hasta cargar de storage, para no auto-abrir de golpe
  const loadedRef = useRef(false);
  const pendingReplay = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        hasSeenTourRef.current = value === 'true';
      })
      .catch(() => {})
      .finally(() => {
        loadedRef.current = true;
      });
  }, []);

  const registerTarget = useCallback((key, ref) => {
    targets.current[key] = ref;
    return () => {
      if (targets.current[key] === ref) delete targets.current[key];
    };
  }, []);

  const getTargetRef = useCallback((key) => targets.current[key] || null, []);

  const beginTour = useCallback(() => {
    setStepIndex(0);
    setVisible(true);
  }, []);

  const finishTour = useCallback(() => {
    setVisible(false);
    hasSeenTourRef.current = true;
    AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {});
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= TOUR_STEPS.length) {
        finishTour();
        return i;
      }
      return i + 1;
    });
  }, [finishTour]);

  const prevStep = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Un componente pide repetir el tour manualmente (desde Perfil → Ayuda),
  // aunque ya se haya visto antes. Se dispara la próxima vez que Home avise
  // que está listo (ver notifyHomeReady), ya que ahí viven los targets.
  const requestReplay = useCallback(() => {
    pendingReplay.current = true;
  }, []);

  // HomeScreen llama esto poco después de montarse (y de que sus animaciones
  // de entrada terminen), que es el único momento en que todos los targets
  // del primer tramo del tour existen a la vez.
  const notifyHomeReady = useCallback(() => {
    if (pendingReplay.current) {
      pendingReplay.current = false;
      beginTour();
      return;
    }
    if (loadedRef.current && !hasSeenTourRef.current && !visible) {
      beginTour();
    }
  }, [beginTour, visible]);

  const value = {
    visible,
    stepIndex,
    steps: TOUR_STEPS,
    totalSteps: TOUR_STEPS.length,
    registerTarget,
    getTargetRef,
    beginTour,
    nextStep,
    prevStep,
    skipTour: finishTour,
    requestReplay,
    notifyHomeReady,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
