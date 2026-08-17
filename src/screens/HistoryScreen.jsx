import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAppAlert } from '../context/AppAlertContext';
import { supabase } from '../config/supabase';

const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

const formatDate = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { confirm, notify } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('calculations')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setItems(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleDelete = (item) => {
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
      <View style={styles.center}>
        <View style={styles.iconBadge}>
          <Ionicons name="time-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.title}>Aún no tienes casos guardados</Text>
        <Text style={styles.body}>
          Desde la Calculadora, toca "Guardar en historial" para ir armando tu cuaderno de trabajo.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name={item.sex === 'M' ? 'male' : 'female'} size={16} color={colors.primary} />
            </View>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
              disabled={deletingId === item.id}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Eliminar caso"
            >
              {deletingId === item.id ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.cardMeta}>
            {item.weight} kg · {item.height} cm · {item.age} años · {item.activity_label}
          </Text>

          <View style={styles.cardResults}>
            <View style={styles.cardResultCol}>
              <Text style={styles.cardResultLabel}>TMB · {item.formula_label || 'Mifflin-St Jeor'}</Text>
              <Text style={styles.cardResultValue}>{Math.round(item.tmb)} kcal</Text>
            </View>
            <View style={styles.cardResultCol}>
              <Text style={styles.cardResultLabel}>GET</Text>
              <Text style={styles.cardResultValue}>{Math.round(item.get)} kcal</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14, backgroundColor: colors.background },
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

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDate: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  deleteButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { fontSize: 12.5, color: colors.textMuted, marginTop: 8 },
  cardResults: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cardResultCol: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardResultLabel: { fontSize: 11, color: colors.textFaint, fontWeight: '700', textTransform: 'uppercase' },
  cardResultValue: { fontSize: 16, fontWeight: '800', color: colors.primary, marginTop: 2 },
});
