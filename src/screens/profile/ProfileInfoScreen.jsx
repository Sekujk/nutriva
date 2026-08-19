import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAppAlert } from '../../context/AppAlertContext';
import { isValidBirthDate, toBirthDateString, formatBirthDate, calculateAge } from '../../utils/birthDate';
import SubScreenHeader from './SubScreenHeader';
import Avatar from '../../components/Avatar';
import BirthDatePicker from '../../components/BirthDatePicker';
import { darken } from '../../utils/color';
import { FONT_DISPLAY } from '../../theme/typography';

export default function ProfileInfoScreen({ onBack }) {
  const { session } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { colors } = useTheme();
  const { notify } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const email = session?.user?.email || '';
  const username = profile?.username || '';
  const avatarUrl = profile?.avatar_url || null;
  const birthDate = profile?.birth_date || '';
  const age = calculateAge(birthDate);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify({ title: 'Permiso necesario', message: 'Activa el acceso a tus fotos para elegir una imagen.', variant: 'warning' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      await uploadAvatar(asset.uri, asset.mimeType || 'image/jpeg');
    } catch (error) {
      notify({ title: 'Error', message: error.message || 'No se pudo subir la foto', variant: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(username);
  const [savingUsername, setSavingUsername] = useState(false);

  const [editingBirthDate, setEditingBirthDate] = useState(false);
  const [savingBirthDate, setSavingBirthDate] = useState(false);
  const [initialDay, initialMonth, initialYear] = birthDate ? birthDate.split('-').reverse() : ['', '', ''];

  const startEditingUsername = () => {
    setUsernameDraft(username);
    setEditingUsername(true);
  };

  const saveUsername = async () => {
    const trimmed = usernameDraft.trim();
    if (trimmed.length < 3) {
      notify({ title: 'Nombre muy corto', message: 'Usa al menos 3 caracteres.', variant: 'warning' });
      return;
    }
    setSavingUsername(true);
    try {
      await updateProfile({ username: trimmed });
      setEditingUsername(false);
    } catch (error) {
      notify({ title: 'Error', message: error.message || 'No se pudo guardar el nombre', variant: 'error' });
    } finally {
      setSavingUsername(false);
    }
  };

  const saveBirthDate = async (day, month, year) => {
    if (!isValidBirthDate(day, month, year)) {
      notify({ title: 'Fecha inválida', message: 'Revisa el día, mes y año ingresados.', variant: 'warning' });
      return;
    }
    setSavingBirthDate(true);
    try {
      await updateProfile({ birth_date: toBirthDateString(day, month, year) });
      setEditingBirthDate(false);
    } catch (error) {
      notify({ title: 'Error', message: error.message || 'No se pudo guardar la fecha', variant: 'error' });
    } finally {
      setSavingBirthDate(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SubScreenHeader title="Perfil" onBack={onBack} />

      <View style={styles.headerBlock}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={pickAvatar}
          disabled={uploadingAvatar}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
        >
          <LinearGradient
            colors={[darken(colors.primary, 0.3), colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <Avatar uri={avatarUrl} label={(username[0] || email[0] || '?').toUpperCase()} size={76} fontSize={28} />
          </LinearGradient>
          {uploadingAvatar ? (
            <View style={styles.avatarLoading}>
              <ActivityIndicator color={colors.background} />
            </View>
          ) : (
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color={colors.background} />
            </View>
          )}
        </TouchableOpacity>

        {editingUsername ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={usernameDraft}
              onChangeText={setUsernameDraft}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              placeholder="Nombre de usuario"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Nombre de usuario"
            />
            <TouchableOpacity
              style={styles.editIconButton}
              onPress={() => setEditingUsername(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editIconButton, styles.editSaveButton]}
              onPress={saveUsername}
              disabled={savingUsername}
              accessibilityRole="button"
              accessibilityLabel="Guardar"
            >
              {savingUsername ? <ActivityIndicator size="small" color={colors.background} /> : (
                <Ionicons name="checkmark" size={18} color={colors.background} />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.usernameRow}
              onPress={startEditingUsername}
              accessibilityRole="button"
              accessibilityLabel="Editar nombre de usuario"
            >
              <Text style={styles.username}>{username || email}</Text>
              <Ionicons name="pencil-outline" size={15} color={colors.textFaint} />
            </TouchableOpacity>
            {!!username && <Text style={styles.email}>{email}</Text>}
            {!!profile?.tag && (
              <View
                style={styles.tagPill}
                accessible
                accessibilityLabel={`Tu código es ${profile.tag}, no se puede cambiar`}
              >
                <Ionicons name="lock-closed-outline" size={11} color={colors.textFaint} />
                <Text style={styles.tagPillText}>#{profile.tag}</Text>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fecha de nacimiento</Text>
        <TouchableOpacity style={styles.rowBetween} onPress={() => setEditingBirthDate(true)} accessibilityRole="button" accessibilityLabel="Editar fecha de nacimiento">
          <Text style={styles.rowValue}>
            {birthDate ? `${formatBirthDate(birthDate)}${age !== null ? ` · ${age} años` : ''}` : 'No definida'}
          </Text>
          <Ionicons name="pencil-outline" size={18} color={colors.textFaint} />
        </TouchableOpacity>
      </View>

      <BirthDatePicker
        visible={editingBirthDate}
        initialDay={initialDay}
        initialMonth={initialMonth}
        initialYear={initialYear}
        saving={savingBirthDate}
        onSave={saveBirthDate}
        onClose={() => setEditingBirthDate(false)}
      />
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  headerBlock: { alignItems: 'center', marginBottom: 18 },
  avatarWrapper: {},
  avatarRing: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center' },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 41,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  username: { fontSize: 18, fontFamily: FONT_DISPLAY, color: colors.text },
  email: { fontSize: 13, fontWeight: '500', color: colors.textMuted, marginTop: 2 },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  tagPillText: { fontSize: 12, fontWeight: '700', color: colors.textFaint },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, width: '100%' },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    minHeight: 48,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  editIconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveButton: { backgroundColor: colors.primary, borderColor: colors.primary },

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
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  rowValue: { fontSize: 16, color: colors.text, fontWeight: '700' },
});
