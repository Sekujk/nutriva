import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useTour } from '../context/TourContext';
import { FONT_DISPLAY_BOLD } from '../theme/typography';
import { hapticLight, hapticSelection } from '../utils/haptics';

const SCRIM = 'rgba(8, 10, 14, 0.76)';
const RECT_PAD = 10;
const CALLOUT_WIDTH = 300;
const CALLOUT_MARGIN = 14;
const MEASURE_RETRY_MS = 260;
const MEASURE_BAIL_MS = 900;

export default function TourOverlay() {
  const { colors } = useTheme();
  const { visible, stepIndex, steps, totalSteps, getTargetRef, nextStep, prevStep, skipTour } = useTour();
  const [rect, setRect] = useState(null);
  const [screen, setScreen] = useState(() => Dimensions.get('window'));

  const step = steps[stepIndex];

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreen(window));
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    if (!visible || !step?.target) {
      setRect(null);
      return undefined;
    }

    let cancelled = false;
    let measured = false;
    const measure = () => {
      const ref = getTargetRef(step.target);
      if (!ref?.current?.measureInWindow) return;
      ref.current.measureInWindow((x, y, width, height) => {
        if (cancelled) return;
        if (width > 0 && height > 0) {
          measured = true;
          setRect({ x, y, width, height });
        }
      });
    };

    measure();
    const retry = setTimeout(measure, MEASURE_RETRY_MS);
    // Si el target nunca aparece (p. ej. cambió de layout inesperadamente),
    // no dejamos el tour trabado: se salta el paso. Pero si ya se midió
    // bien, este timer NO debe avanzar el paso por su cuenta.
    const bail = setTimeout(() => {
      if (!cancelled && !measured) nextStep();
    }, MEASURE_BAIL_MS);

    return () => {
      cancelled = true;
      clearTimeout(retry);
      clearTimeout(bail);
    };
  }, [visible, stepIndex, step, getTargetRef, screen, nextStep]);

  if (!visible || !step) return null;

  const styles = getStyles(colors);
  const spotlighted = !!step.target && !!rect;

  let calloutPosition;
  if (spotlighted) {
    const spaceBelow = screen.height - (rect.y + rect.height);
    const placeBelow = spaceBelow > 220 || spaceBelow >= rect.y;
    let left = rect.x + rect.width / 2 - CALLOUT_WIDTH / 2;
    left = Math.max(16, Math.min(left, screen.width - CALLOUT_WIDTH - 16));
    calloutPosition = placeBelow
      ? { left, top: rect.y + rect.height + CALLOUT_MARGIN + RECT_PAD }
      : { left, bottom: screen.height - rect.y + CALLOUT_MARGIN + RECT_PAD };
  } else {
    calloutPosition = {
      left: (screen.width - CALLOUT_WIDTH) / 2,
      top: Math.max(24, (screen.height - 260) / 2),
    };
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={skipTour}>
      <View style={StyleSheet.absoluteFill}>
        {spotlighted ? (
          <>
            <View style={[styles.scrimPiece, { top: 0, left: 0, right: 0, height: Math.max(0, rect.y - RECT_PAD) }]} />
            <View style={[styles.scrimPiece, { top: rect.y + rect.height + RECT_PAD, left: 0, right: 0, bottom: 0 }]} />
            <View
              style={[
                styles.scrimPiece,
                { top: rect.y - RECT_PAD, left: 0, width: Math.max(0, rect.x - RECT_PAD), height: rect.height + RECT_PAD * 2 },
              ]}
            />
            <View
              style={[
                styles.scrimPiece,
                { top: rect.y - RECT_PAD, left: rect.x + rect.width + RECT_PAD, right: 0, height: rect.height + RECT_PAD * 2 },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.spotlightRing,
                {
                  top: rect.y - RECT_PAD,
                  left: rect.x - RECT_PAD,
                  width: rect.width + RECT_PAD * 2,
                  height: rect.height + RECT_PAD * 2,
                },
              ]}
            />
          </>
        ) : (
          <View style={styles.fullScrim} />
        )}

        {/* Bloquea toques a la app de fondo mientras el tour está activo, incluida el área señalada. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => {}} />

        <View style={[styles.callout, calloutPosition]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => { hapticLight(); skipTour(); }}
            accessibilityRole="button"
            accessibilityLabel="Saltar guía"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={styles.calloutTitle}>{step.title}</Text>
          <Text style={styles.calloutBody}>{step.body}</Text>

          <View style={styles.calloutFooter}>
            <View style={styles.dotsRow}>
              {steps.map((s, i) => (
                <View key={s.key} style={[styles.dot, i === stepIndex && styles.dotActive]} />
              ))}
            </View>
            <View style={styles.calloutButtons}>
              {stepIndex > 0 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => { hapticSelection(); prevStep(); }}
                  accessibilityRole="button"
                  accessibilityLabel="Paso anterior"
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.backButtonText}>Atrás</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => { hapticSelection(); nextStep(); }}
                accessibilityRole="button"
                accessibilityLabel={stepIndex === totalSteps - 1 ? 'Terminar guía' : 'Siguiente paso'}
              >
                <Text style={styles.nextButtonText}>{stepIndex === totalSteps - 1 ? '¡Listo!' : 'Siguiente'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  fullScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: SCRIM },
  scrimPiece: { position: 'absolute', backgroundColor: SCRIM },
  spotlightRing: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  callout: {
    position: 'absolute',
    width: CALLOUT_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    zIndex: 1,
  },
  calloutTitle: { fontSize: 17, fontFamily: FONT_DISPLAY_BOLD, color: colors.text, marginRight: 30, marginBottom: 8 },
  calloutBody: { fontSize: 13.5, color: colors.textMuted, lineHeight: 19, marginBottom: 18 },
  calloutFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dotsRow: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 16 },
  calloutButtons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backButton: { paddingHorizontal: 8, paddingVertical: 10 },
  backButtonText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  nextButton: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  nextButtonText: { color: colors.background, fontSize: 13.5, fontWeight: '700' },
});
