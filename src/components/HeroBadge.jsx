import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { darken } from '../utils/color';

export default function HeroBadge({ icon, emoji, size = 64, iconSize, style }) {
  const { colors } = useTheme();
  const resolvedIconSize = iconSize || Math.round(size * 0.42);

  return (
    <LinearGradient
      colors={[darken(colors.primary, 0.32), colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: colors.primary,
        },
        style,
      ]}
    >
      {emoji ? (
        <Text style={{ fontSize: resolvedIconSize, lineHeight: resolvedIconSize * 1.15 }}>{emoji}</Text>
      ) : (
        <Ionicons name={icon} size={resolvedIconSize} color={colors.background} />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },
});
