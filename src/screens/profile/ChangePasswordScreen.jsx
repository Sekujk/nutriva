import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAppAlert } from '../../context/AppAlertContext';
import SubScreenHeader from './SubScreenHeader';

const MIN_LENGTH = 6;

export default function ChangePasswordScreen({ onBack }) {
  const { updatePassword } = useAuth();
  const { colors } = useTheme();
  const { notify } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const canSave = password.length >= MIN_LENGTH && password === confirm;

  const handleSave = async () => {
    if (password.length < MIN_LENGTH) {
      notify({ title: 'Muy corta', message: `Usa al menos ${MIN_LENGTH} caracteres.`, variant: 'warning' });
      return;
    }
    if (password !== confirm) {
      notify({ title: 'No coinciden', message: 'Las dos contraseñas deben ser iguales.', variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await updatePassword(password);
      setDone(true);
      setPassword('');
      setConfirm('');
    } catch (error) {
      notify({ title: 'No se pudo cambiar', message: error.message || 'Intenta de nuevo.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <SubScreenHeader title="Cambiar contraseña" onBack={onBack} />
        <View style={styles.thanksCard}>
          <View style={styles.thanksIcon}>
            <Ionicons name="checkmark" size={26} color={colors.background} />
          </View>
          <Text style={styles.thanksTitle}>Contraseña actualizada</Text>
          <Text style={styles.thanksBody}>La próxima vez que inicies sesión, usa la nueva.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SubScreenHeader title="Cambiar contraseña" onBack={onBack} />

      <View style={styles.note}>
        <Text style={styles.noteParagraph}>
          Como ya tienes la sesión abierta, solo necesitas escribir la nueva contraseña dos veces.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nueva contraseña</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Nueva contraseña"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.cardTitle, { marginTop: 14 }]}>Confirmar nueva contraseña</Text>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showPassword}
          placeholder="Repite la contraseña"
          placeholderTextColor={colors.placeholder}
          accessibilityLabel="Confirmar nueva contraseña"
        />

        <TouchableOpacity
          style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar nueva contraseña"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1, gap: 16 },

  note: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  noteParagraph: { fontSize: 13.5, color: colors.text, lineHeight: 20 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 12, color: colors.textMuted, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputRow: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  eyeButton: { position: 'absolute', right: 10, height: '100%', justifyContent: 'center', paddingHorizontal: 4 },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginTop: 18,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: colors.background, fontSize: 15, fontWeight: '700' },

  thanksCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  thanksIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  thanksTitle: { fontSize: 17, color: colors.text, fontWeight: '700' },
  thanksBody: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center' },
});
