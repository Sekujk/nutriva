import React from 'react';
import { View, StyleSheet } from 'react-native';

// Bandas de color en vez de emoji: en Windows, los emoji de bandera
// (🇵🇪 🇬🇹) suelen renderizarse como el código de país en texto plano
// ("PE"/"GT") en vez de la bandera, porque la fuente de emoji del
// sistema no soporta esas secuencias. Esto se ve igual en cualquier
// plataforma.
const FLAG_BANDS = {
  PE: ['#D91023', '#FFFFFF', '#D91023'],
  GT: ['#4997D0', '#FFFFFF', '#4997D0'],
};

export default function CountryFlag({ code, size = 22, style }) {
  const bands = FLAG_BANDS[code] || ['#c4c4c4', '#e8e8e8', '#c4c4c4'];
  const width = Math.round(size * 1.4);

  return (
    <View style={[styles.wrap, { width, height: size, borderRadius: size * 0.16 }, style]}>
      {bands.map((color, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
});
