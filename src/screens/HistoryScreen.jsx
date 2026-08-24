import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAppAlert } from '../context/AppAlertContext';
import { supabase } from '../config/supabase';
import { lighten } from '../utils/color';
import { FONT_DISPLAY, FONT_DISPLAY_BOLD } from '../theme/typography';
import Hoverable from '../components/Hoverable';
import useResponsive from '../hooks/useResponsive';
import CalculationBreakdown from '../components/CalculationBreakdown';
import { hapticLight, hapticWarning } from '../utils/haptics';

const MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

const MONTHS_FULL = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const formatDate = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

const monthGroupKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
};

const monthGroupLabel = (iso) => {
  const d = new Date(iso);
  const label = `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function HistoryCard({ item, index, deleting, onDelete, onOpen, colors, styles }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 280,
      delay: Math.min(index, 6) * 45,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      <Hoverable scaleTo={1.008}>
        {({ hovered }) => (
          <TouchableOpacity
            style={[styles.card, hovered && styles.cardHovered]}
            onPress={() => onOpen(item)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Ver cómo se calculó el caso del ${formatDate(item.created_at)}`}
          >
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={[lighten(colors.primarySoft, 0.18), colors.primarySoft]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIcon}
              >
                <Ionicons name={item.sex === 'M' ? 'male' : 'female'} size={16} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDelete(item)}
                disabled={deleting}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Eliminar caso"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.cardMeta}>
              {item.weight} kg · {item.height} cm · {item.age} años · {item.activity_label}
            </Text>

            <View style={styles.formulaPill}>
              <Text style={styles.formulaPillText}>{item.formula_label || 'Mifflin-St Jeor'}</Text>
            </View>

            <View style={styles.cardResults}>
              <View style={styles.cardResultCol}>
                <Text style={styles.cardResultLabel}>TMB</Text>
                <Text style={styles.cardResultValue}>{Math.round(item.tmb)}</Text>
                <Text style={styles.cardResultUnit}>kcal/día</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.cardResultCol}>
                <Text style={styles.cardResultLabel}>GET</Text>
                <Text style={styles.cardResultValue}>{Math.round(item.get)}</Text>
                <Text style={styles.cardResultUnit}>kcal/día</Text>
              </View>
            </View>

            <View style={styles.cardHint}>
              <Ionicons name="grid-outline" size={12} color={colors.textFaint} />
              <Text style={styles.cardHintText}>Toca para ver cómo se calculó</Text>
            </View>
          </TouchableOpacity>
        )}
      </Hoverable>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { confirm, notify } = useAppAlert();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [openItem, setOpenItem] = useState(null);

  const loadItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setItems(data || []);
    return error;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadItems().then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loadItems]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticLight();
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = monthGroupKey(item.created_at);
      if (!map.has(key)) map.set(key, { label: monthGroupLabel(item.created_at), items: [] });
      map.get(key).items.push(item);
    });
    return [...map.values()];
  }, [items]);

  const handleDelete = (item) => {
    hapticWarning();
    confirm({
      title: 'Eliminar caso',
      message: `Se va a borrar el caso del ${formatDate(item.created_at)} para siempre.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
      onConfirm: async () => {
        setDeletingId(item.id);
        const { error } = await supabase.from('calculations').delete().eq('id', item.id);
        if (error) {
          notify({ title: 'No se pudo eliminar', message: error.message, variant: 'error' });
        } else {
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        }
        setDeletingId(null);
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.centerScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.iconBadge}>
          <Ionicons name="time-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.title}>Aún no tienes casos guardados</Text>
        <Text style={styles.body}>
          Desde la Calculadora, toca "Guardar en historial" para ir armando tu cuaderno de trabajo.
        </Text>
      </ScrollView>
    );
  }

  let runningIndex = 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <View style={isDesktop ? styles.desktopWrap : null}>
        {groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <Text style={styles.monthLabel}>{group.label}</Text>
            <View style={styles.list}>
              {group.items.map((item) => {
                const cardIndex = runningIndex;
                runningIndex += 1;
                return (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    index={cardIndex}
                    deleting={deletingId === item.id}
                    onDelete={handleDelete}
                    onOpen={setOpenItem}
                    colors={colors}
                    styles={styles}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <CalculationBreakdown visible={!!openItem} calc={openItem} onClose={() => setOpenItem(null)} />
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  desktopWrap: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14, backgroundColor: colors.background },
  centerScroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14, backgroundColor: colors.background },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 18, fontFamily: FONT_DISPLAY, color: colors.text, textAlign: 'center' },
  body: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  group: { marginBottom: 22 },
  monthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  list: { gap: 12 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardHovered: { borderColor: colors.primary, shadowOpacity: 0.12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDate: { flex: 1, fontSize: 14.5, fontFamily: FONT_DISPLAY, color: colors.text },
  deleteButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { fontSize: 12.5, color: colors.textMuted, marginTop: 10 },

  formulaPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  formulaPillText: { fontSize: 11, fontWeight: '700', color: colors.primary },

  cardResults: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    marginTop: 14,
    paddingVertical: 12,
  },
  cardResultCol: { flex: 1, alignItems: 'center' },
  resultDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  cardResultLabel: { fontSize: 10.5, color: colors.textFaint, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  cardResultValue: { fontSize: 20, fontFamily: FONT_DISPLAY_BOLD, color: colors.primary, marginTop: 3 },
  cardResultUnit: { fontSize: 10, color: colors.textFaint, marginTop: 1 },
  cardHint: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 10 },
  cardHintText: { fontSize: 10.5, color: colors.textFaint },
});
