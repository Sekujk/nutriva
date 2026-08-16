import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { useCountry } from '../../context/CountryContext';
import { useAppAlert } from '../../context/AppAlertContext';
import SubScreenHeader from './SubScreenHeader';
import CountryFlag from '../../components/CountryFlag';

export default function SettingsScreen({ onBack }) {
  const { signOut, deleteAccount } = useAuth();
  const { colors } = useTheme();
  const { country, setCountry, countries } = useCountry();
  const { notify, confirm } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    confirm({
      title: 'Eliminar cuenta',
      message: 'Esta acción es permanente y no se puede deshacer. Se eliminará tu cuenta y todos tus datos de Nutriva para siempre.',
      confirmText: 'Eliminar para siempre',
      cancelText: 'Cancelar',
      destructive: true,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await deleteAccount();
        } catch (error) {
          notify({ title: 'No se pudo eliminar la cuenta', message: error.message || 'Intenta de nuevo más tarde.', variant: 'error' });
          setDeleting(false);
        }
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SubScreenHeader title="Configuración" onBack={onBack} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>País</Text>
        <View style={styles.segmented}>
          {countries.map((c) => {
            const active = country === c.code;
            return (
              <TouchableOpacity
                key={c.code}
                style={[styles.segmentButton, active && styles.segmentButtonActive]}
                onPress={() => setCountry(c.code)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={c.name}
              >
                <CountryFlag code={c.code} size={16} style={styles.segmentFlag} />
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>Define qué tabla de composición de alimentos vas a usar.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cuenta</Text>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel="Eliminar cuenta"
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Text style={styles.deleteText}>Eliminar cuenta</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 12, color: colors.textMuted, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 5,
    gap: 4,
  },
  segmentButton: { flex: 1, flexDirection: 'row', gap: 8, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  segmentFlag: {},
  segmentButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  segmentTextActive: { color: colors.background },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 8, lineHeight: 16 },

  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.dangerSoft,
  },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  deleteButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  deleteText: { color: colors.textFaint, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});
