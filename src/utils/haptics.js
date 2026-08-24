import * as Haptics from 'expo-haptics';

// expo-haptics usa el motor de haptics en iOS/Android y la Vibration API en
// web; se envuelve en try/catch porque algunos navegadores/dispositivos no
// la soportan y no debe romper la interacción por eso.
const safeCall = (fn) => {
  try {
    const result = fn();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch {
    // no-op: la vibración/haptics es un extra, nunca algo bloqueante
  }
};

export const hapticLight = () => safeCall(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const hapticMedium = () => safeCall(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const hapticSelection = () => safeCall(() => Haptics.selectionAsync());
export const hapticSuccess = () => safeCall(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const hapticWarning = () => safeCall(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
export const hapticError = () => safeCall(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
