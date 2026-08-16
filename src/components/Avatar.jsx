import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function Avatar({ uri, label, size = 44, fontSize, style, borderWidth = 0 }) {
  const { colors } = useTheme();
  const resolvedFontSize = fontSize || Math.round(size * 0.4);
  const shape = { width: size, height: size, borderRadius: size / 2, borderWidth, borderColor: colors.primary };

  if (uri) {
    return <Image source={{ uri }} style={[shape, style]} />;
  }

  return (
    <View style={[styles.fallback, shape, { backgroundColor: colors.primarySoft }, style]}>
      <Text style={{ fontSize: resolvedFontSize, fontWeight: '800', color: colors.primary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
