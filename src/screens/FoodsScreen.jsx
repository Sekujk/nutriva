import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useCountry } from '../context/CountryContext';
import Hoverable from '../components/Hoverable';
import foodsPeru from '../data/foodsPeru';
import foodsGuatemala from '../data/foodsGuatemala';
import { lighten } from '../utils/color';

const DATASETS = { PE: foodsPeru, GT: foodsGuatemala };

const GROUP_ICONS = {
  Cereales: 'basket-outline',
  Verduras: 'leaf-outline',
  Frutas: 'nutrition-outline',
  Pescados: 'fish-outline',
  Carnes: 'restaurant-outline',
  Lácteos: 'cafe-outline',
  Huevos: 'egg-outline',
  Leguminosas: 'ellipse-outline',
  Tubérculos: 'earth-outline',
  Azúcares: 'flame-outline',
};

function fmt(n) {
  return Number.isFinite(n) ? (Number.isInteger(n) ? n : n.toFixed(1)) : '—';
}

function FoodCard({ food, index, colors, styles }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 260,
      delay: Math.min(index, 8) * 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      }}
    >
      <Hoverable scaleTo={1.015}>
        {({ hovered }) => (
          <View style={[styles.card, hovered && styles.cardHovered]}>
            <View style={styles.cardTop}>
              <LinearGradient
                colors={[lighten(colors.primarySoft, 0.18), colors.primarySoft]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIcon}
              >
                <Ionicons name={GROUP_ICONS[food.group] || 'restaurant-outline'} size={18} color={colors.primary} />
              </LinearGradient>
              <View style={styles.cardTitleCol}>
                <Text style={styles.cardName}>{food.name}</Text>
                <Text style={styles.cardGroup}>{food.group} · por 100 g</Text>
              </View>
              <View style={styles.kcalPill}>
                <Text style={styles.kcalValue}>{fmt(food.kcal)}</Text>
                <Text style={styles.kcalUnit}>kcal</Text>
              </View>
            </View>
            <View style={styles.macroRow}>
              <View style={styles.macroCol}>
                <Text style={styles.macroValue}>{fmt(food.protein)} g</Text>
                <Text style={styles.macroLabel}>Proteína</Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={styles.macroValue}>{fmt(food.fat)} g</Text>
                <Text style={styles.macroLabel}>Grasa</Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={styles.macroValue}>{fmt(food.carbs)} g</Text>
                <Text style={styles.macroLabel}>Carbohidratos</Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={styles.macroValue}>{fmt(food.fiber)} g</Text>
                <Text style={styles.macroLabel}>Fibra</Text>
              </View>
            </View>
          </View>
        )}
      </Hoverable>
    </Animated.View>
  );
}

export default function FoodsScreen() {
  const { colors } = useTheme();
  const { country, countries } = useCountry();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState(null);

  const countryInfo = countries.find((c) => c.code === country);
  const foods = DATASETS[country] || [];

  const groups = useMemo(() => [...new Set(foods.map((f) => f.group))], [foods]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return foods.filter((f) => {
      const matchesSearch = !q || f.name.toLowerCase().includes(q);
      const matchesGroup = !activeGroup || f.group === activeGroup;
      return matchesSearch && matchesGroup;
    });
  }, [foods, search, activeGroup]);

  if (!countryInfo) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.iconBadge}>
          <Ionicons name="restaurant-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.title}>Elige tu país en Perfil</Text>
        <Text style={styles.body}>Así sabemos qué tabla de composición de alimentos mostrarte.</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={19} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Buscar en ${foods.length} alimentos...`}
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          accessibilityLabel="Buscar alimento"
        />
      </View>

      <View style={styles.chipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, !activeGroup && styles.chipActive]}
            onPress={() => setActiveGroup(null)}
            accessibilityRole="radio"
            accessibilityState={{ selected: !activeGroup }}
            accessibilityLabel="Todos los grupos"
          >
            <Text style={[styles.chipText, !activeGroup && styles.chipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {groups.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, activeGroup === g && styles.chipActive]}
              onPress={() => setActiveGroup((prev) => (prev === g ? null : g))}
              accessibilityRole="radio"
              accessibilityState={{ selected: activeGroup === g }}
              accessibilityLabel={g}
            >
              <Text style={[styles.chipText, activeGroup === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sourceHint}>
        Fuente: tabla oficial {countryInfo.tableSource} ({countryInfo.name})
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.emptyInline}>
            <Ionicons name="search-outline" size={26} color={colors.textFaint} />
            <Text style={styles.body}>No encontramos ese alimento en esta tabla todavía.</Text>
          </View>
        ) : (
          filtered.map((food, index) => (
            <FoodCard key={food.name} food={food} index={index} colors={colors} styles={styles} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14, backgroundColor: colors.background },
  emptyInline: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  searchWrapper: { justifyContent: 'center', marginHorizontal: 20, marginTop: 16 },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingVertical: 12,
    paddingLeft: 44,
    paddingRight: 14,
    fontSize: 15,
    minHeight: 48,
    color: colors.text,
    backgroundColor: colors.surface,
  },

  chipsWrapper: { marginTop: 12 },
  chipsRow: { paddingHorizontal: 20, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, color: colors.primary, fontWeight: '600' },
  chipTextActive: { color: colors.background },

  sourceHint: { fontSize: 11, color: colors.textFaint, marginTop: 10, marginHorizontal: 20 },

  list: { padding: 20, paddingTop: 12, gap: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardHovered: { borderColor: colors.primary, shadowOpacity: 0.1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleCol: { flex: 1 },
  cardName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  cardGroup: { fontSize: 11, color: colors.textFaint, marginTop: 1 },
  kcalPill: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  kcalValue: { fontSize: 15, fontWeight: '800', color: colors.primary },
  kcalUnit: { fontSize: 9, color: colors.primary, fontWeight: '600' },
  macroRow: { flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  macroCol: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  macroLabel: { fontSize: 9.5, color: colors.textMuted, marginTop: 1, textAlign: 'center' },
});
