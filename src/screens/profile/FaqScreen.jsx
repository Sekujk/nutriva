import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import SubScreenHeader from './SubScreenHeader';
import Hoverable from '../../components/Hoverable';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    q: '¿Cómo cambio mi país?',
    a: 'Ve a Perfil → País y elige Perú o Guatemala. Eso define qué tabla oficial de composición de alimentos vas a ver en la sección Alimentos.',
  },
  {
    q: '¿De dónde salen los datos de los alimentos?',
    a: 'De fuentes oficiales: para Perú, las "Tablas peruanas de composición de alimentos" del INS (10ma edición, 2017); para Guatemala, la "Tabla de composición de alimentos de Centroamérica" del INCAP (2da edición, 2012). Nada está inventado.',
  },
  {
    q: '¿Puedo editar el resultado de la Calculadora?',
    a: 'Sí. Toca el número de TMB o GET para escribirlo manualmente, útil si ya tienes un valor calculado por otro método. Toca "Restaurar" para volver al cálculo automático.',
  },
  {
    q: '¿Dónde quedan mis casos guardados?',
    a: 'En Historial. Desde la Calculadora, toca "Guardar en historial" y el caso queda ahí con fecha, datos y resultado, como un cuaderno de trabajo digital.',
  },
  {
    q: '¿Cómo cambio mi foto o mi nombre?',
    a: 'En Perfil → Perfil: toca la foto para cambiarla, o el nombre para editarlo.',
  },
  {
    q: '¿Mis datos son privados?',
    a: 'Sí. Cada cuenta solo puede ver y modificar su propia información: perfil, historial y foto son privados a tu usuario.',
  },
  {
    q: '¿Qué pasa si elimino mi cuenta?',
    a: 'Se borra todo para siempre: tu perfil, tu historial de cálculos y tus preferencias. No se puede deshacer, así que solo hazlo si estás segura o seguro.',
  },
  {
    q: '¿Van a agregar más países?',
    a: 'Es la idea, pero cada país necesita una tabla de composición de alimentos oficial y confiable como fuente. Se irán agregando según se consigan esas fuentes.',
  },
];

function FaqItem({ item, isOpen, onToggle, colors, styles }) {
  return (
    <Hoverable scaleTo={1.005}>
      {({ hovered }) => (
        <View style={[styles.item, (isOpen || hovered) && styles.itemActive]}>
          <TouchableOpacity
            style={styles.question}
            onPress={onToggle}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
            accessibilityLabel={item.q}
          >
            <Text style={styles.questionText}>{item.q}</Text>
            <Ionicons name={isOpen ? 'remove' : 'add'} size={18} color={colors.primary} />
          </TouchableOpacity>
          {isOpen && <Text style={styles.answerText}>{item.a}</Text>}
        </View>
      )}
    </Hoverable>
  );
}

export default function FaqScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SubScreenHeader title="Preguntas frecuentes" onBack={onBack} />

      <View style={styles.list}>
        {FAQS.map((item, index) => (
          <FaqItem
            key={item.q}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => toggle(index)}
            colors={colors}
            styles={styles}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  list: { gap: 10 },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemActive: { borderColor: colors.primary },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 60,
  },
  questionText: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.text, lineHeight: 20 },
  answerText: { fontSize: 13.5, color: colors.textMuted, lineHeight: 20, paddingBottom: 16, paddingTop: 2 },
});
