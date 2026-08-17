import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAppAlert } from '../../context/AppAlertContext';
import { FONT_DISPLAY, FONT_DISPLAY_ITALIC } from '../../theme/typography';
import SubScreenHeader from './SubScreenHeader';

const MAX_LENGTH = 600;

export default function SuggestionsScreen({ onBack }) {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { notify } = useAppAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const trimmed = message.trim();

  const handleSend = async () => {
    if (trimmed.length < 5) {
      notify({ title: 'Cuéntanos un poco más', message: 'Escribe al menos unas palabras.', variant: 'warning' });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from('suggestions').insert({ user_id: session.user.id, message: trimmed });
      if (error) throw error;
      setMessage('');
      setSent(true);
    } catch (error) {
      notify({ title: 'No se pudo enviar', message: error.message || 'Intenta de nuevo.', variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <SubScreenHeader title="Sugerencias" onBack={onBack} />
        <View style={styles.thanksCard}>
          <View style={styles.thanksIcon}>
            <Ionicons name="checkmark" size={26} color={colors.background} />
          </View>
          <Text style={styles.thanksTitle}>Gracias por escribir</Text>
          <Text style={styles.thanksBody}>Tu idea ya quedó guardada. La leemos con calma.</Text>
          <TouchableOpacity style={styles.thanksButton} onPress={() => setSent(false)} accessibilityRole="button" accessibilityLabel="Enviar otra sugerencia">
            <Text style={styles.thanksButtonText}>Enviar otra</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SubScreenHeader title="Sugerencias" onBack={onBack} />

      <View style={styles.note}>
        <Text style={styles.noteParagraph}>
          ¿Falta algo, algo no funciona bien, o se te ocurrió una idea para Nutriva?
          Escríbela aquí, la leemos directamente.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tu sugerencia</Text>
        <TextInput
          style={styles.textArea}
          value={message}
          onChangeText={(text) => setMessage(text.slice(0, MAX_LENGTH))}
          placeholder="Por ejemplo: sería bueno poder exportar el historial a PDF..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={MAX_LENGTH}
          accessibilityLabel="Escribe tu sugerencia"
        />
        <Text style={styles.counter}>{trimmed.length}/{MAX_LENGTH}</Text>

        <TouchableOpacity
          style={[styles.sendButton, (sending || trimmed.length < 5) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending || trimmed.length < 5}
          accessibilityRole="button"
          accessibilityLabel="Enviar sugerencia"
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={16} color={colors.background} />
              <Text style={styles.sendButtonText}>Enviar</Text>
            </>
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
  textArea: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 140,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  counter: { fontSize: 11, color: colors.textFaint, textAlign: 'right', marginTop: 6 },

  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginTop: 14,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: colors.background, fontSize: 15, fontWeight: '700' },

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
  thanksTitle: { fontSize: 17, fontFamily: FONT_DISPLAY, color: colors.text },
  thanksBody: { fontSize: 13.5, fontFamily: FONT_DISPLAY_ITALIC, color: colors.textMuted, textAlign: 'center' },
  thanksButton: { marginTop: 12, minHeight: 40, justifyContent: 'center', paddingHorizontal: 16 },
  thanksButtonText: { color: colors.primary, fontSize: 13.5, fontWeight: '700' },
});
