import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useCountry } from '../context/CountryContext';

export default function FoodsScreen() {
  const { colors } = useTheme();
  const { country, countries } = useCountry();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const countryInfo = countries.find((c) => c.code === country);

  return (
    <View style={styles.container}>
      <Ionicons name="restaurant-outline" size={40} color={colors.textFaint} />
      <Text style={styles.title}>Tabla de composición de alimentos</Text>
      <Text style={styles.body}>
        {countryInfo
          ? `Próximamente: búsqueda de alimentos con datos de la tabla oficial de ${countryInfo.tableSource} (${countryInfo.name}).`
          : 'Elige tu país en Perfil para ver la tabla de alimentos correspondiente.'}
      </Text>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: colors.background },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  body: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
