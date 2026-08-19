import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCountry } from '../../context/CountryContext';
import { useTheme } from '../../theme/ThemeContext';
import { FONT_DISPLAY } from '../../theme/typography';
import Avatar from '../../components/Avatar';
import CalculationBreakdown from '../../components/CalculationBreakdown';
import Hoverable from '../../components/Hoverable';
import foodsPeru from '../../data/foodsPeru';
import foodsGuatemala from '../../data/foodsGuatemala';

const DATASETS = { PE: foodsPeru, GT: foodsGuatemala };
const TYPING_BROADCAST_THROTTLE_MS = 1500;
const TYPING_EXPIRE_MS = 3000;
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function fmt(n) {
  return Number.isFinite(n) ? (Number.isInteger(n) ? n : n.toFixed(1)) : 'N/D';
}

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
};

function FoodAttachment({ attachment, mine, colors, styles }) {
  return (
    <View style={[styles.attachCard, mine && styles.attachCardMine]}>
      <View style={styles.attachHeaderRow}>
        <Ionicons name="restaurant-outline" size={14} color={mine ? colors.background : colors.primary} />
        <Text style={[styles.attachTitle, mine && styles.attachTitleMine]} numberOfLines={2}>{attachment.name}</Text>
      </View>
      <Text style={[styles.attachSub, mine && styles.attachSubMine]}>{fmt(attachment.kcal)} kcal · por 100 g</Text>
      <View style={styles.macroRow}>
        <Text style={[styles.macroText, mine && styles.attachSubMine]}>P {fmt(attachment.protein)}g</Text>
        <Text style={[styles.macroText, mine && styles.attachSubMine]}>G {fmt(attachment.fat)}g</Text>
        <Text style={[styles.macroText, mine && styles.attachSubMine]}>C {fmt(attachment.carbs)}g</Text>
      </View>
    </View>
  );
}

function CalculationAttachment({ attachment, mine, colors, styles, onOpen }) {
  return (
    <TouchableOpacity style={[styles.attachCard, mine && styles.attachCardMine]} onPress={onOpen} accessibilityRole="button" accessibilityLabel="Ver cómo se calculó">
      <View style={styles.attachHeaderRow}>
        <Ionicons name="flash-outline" size={14} color={mine ? colors.background : colors.primary} />
        <Text style={[styles.attachTitle, mine && styles.attachTitleMine]} numberOfLines={2}>
          {attachment.label || 'Gasto energético'}
        </Text>
      </View>
      <Text style={[styles.attachSub, mine && styles.attachSubMine]}>{attachment.activity_label} · {attachment.formula_label || 'Mifflin-St Jeor'}</Text>
      <View style={styles.macroRow}>
        <Text style={[styles.macroText, mine && styles.attachSubMine]}>TMB {fmt(attachment.tmb)} kcal</Text>
        <Text style={[styles.macroText, mine && styles.attachSubMine]}>GET {fmt(attachment.get)} kcal</Text>
      </View>
      <View style={styles.attachTapHint}>
        <Ionicons name="grid-outline" size={10} color={mine ? colors.background : colors.textFaint} />
        <Text style={[styles.attachTapHintText, mine && styles.attachSubMine]}>Toca para ver el detalle</Text>
      </View>
    </TouchableOpacity>
  );
}

function ReactionPills({ counts, myEmoji, mine, onToggle, styles }) {
  if (counts.length === 0) return null;
  return (
    <View style={[styles.reactionRow, mine && styles.reactionRowMine]}>
      {counts.map(({ emoji, count }) => (
        <TouchableOpacity
          key={emoji}
          style={[styles.reactionPill, emoji === myEmoji && styles.reactionPillMine]}
          onPress={() => onToggle(emoji)}
          accessibilityRole="button"
          accessibilityLabel={`Reacción ${emoji}, ${count}`}
        >
          <Text style={styles.reactionPillText}>{emoji} {count}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReactionPicker({ mine, canDelete, onPick, onDelete, onClose, colors, styles }) {
  return (
    <View style={[styles.reactionPicker, mine && styles.reactionPickerMine]}>
      {REACTION_EMOJIS.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          style={styles.reactionPickerEmoji}
          onPress={() => onPick(emoji)}
          accessibilityRole="button"
          accessibilityLabel={`Reaccionar con ${emoji}`}
        >
          <Text style={styles.reactionPickerEmojiText}>{emoji}</Text>
        </TouchableOpacity>
      ))}
      {canDelete && (
        <TouchableOpacity
          style={styles.reactionPickerDelete}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Eliminar mensaje"
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger || '#c0392b'} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.reactionPickerClose} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar">
        <Ionicons name="close" size={14} color={colors.textFaint} />
      </TouchableOpacity>
    </View>
  );
}

function MessageBubble({
  message, mine, sender, showSenderName, colors, styles, onOpenCalculation,
  reactionCounts, myEmoji, active, onOpenActions, onCloseActions, onToggleReaction, onDelete,
}) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, { toValue: 1, friction: 8, tension: 90, useNativeDriver: true }).start();
  }, []);

  const isDeleted = !!message.deleted_at;

  return (
    <Animated.View
      style={[
        styles.messageRow,
        mine && styles.messageRowMine,
        {
          opacity: entrance,
          transform: [
            { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        },
      ]}
    >
      <View style={styles.messageCol}>
        <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
          <TouchableOpacity
            activeOpacity={isDeleted ? 1 : 0.85}
            onLongPress={isDeleted ? undefined : onOpenActions}
            delayLongPress={350}
            style={[styles.bubble, mine && styles.bubbleMine, isDeleted && styles.bubbleDeleted]}
          >
            {showSenderName && !mine && !!sender?.username && (
              <Text style={styles.senderName}>{sender.username}</Text>
            )}
            {isDeleted ? (
              <Text style={[styles.bubbleTextDeleted, mine && styles.bubbleTextDeletedMine]}>
                <Ionicons name="ban-outline" size={12} color={mine ? colors.background : colors.textFaint} /> Mensaje eliminado
              </Text>
            ) : (
              <>
                {!!message.text && <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.text}</Text>}
                {message.attachment_kind === 'food' && (
                  <FoodAttachment attachment={message.attachment} mine={mine} colors={colors} styles={styles} />
                )}
                {message.attachment_kind === 'calculation' && (
                  <CalculationAttachment
                    attachment={message.attachment}
                    mine={mine}
                    colors={colors}
                    styles={styles}
                    onOpen={() => onOpenCalculation(message.attachment)}
                  />
                )}
              </>
            )}
            <Text style={[styles.time, mine && styles.timeMine]}>{formatTime(message.created_at)}</Text>
          </TouchableOpacity>
          {!isDeleted && (
            <Hoverable scaleTo={1}>
              {() => (
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => (active ? onCloseActions() : onOpenActions())}
                  accessibilityRole="button"
                  accessibilityLabel="Más opciones"
                >
                  <Ionicons name="ellipsis-horizontal" size={14} color={colors.textFaint} />
                </TouchableOpacity>
              )}
            </Hoverable>
          )}
        </View>

        {active && !isDeleted && (
          <ReactionPicker
            mine={mine}
            canDelete={mine}
            onPick={(emoji) => onToggleReaction(emoji)}
            onDelete={onDelete}
            onClose={onCloseActions}
            colors={colors}
            styles={styles}
          />
        )}

        {!isDeleted && (
          <ReactionPills
            counts={reactionCounts}
            myEmoji={myEmoji}
            mine={mine}
            onToggle={onToggleReaction}
            styles={styles}
          />
        )}
      </View>
    </Animated.View>
  );
}

function TypingDots({ color }) {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.delay((2 - i) * 140),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: color,
            opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
            transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
          }}
        />
      ))}
    </View>
  );
}

function TypingIndicator({ typists, colors, styles }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [typists.length]);

  if (typists.length === 0) return null;

  return (
    <Animated.View style={[styles.typingRow, { opacity: entrance }]}>
      <View style={styles.typingAvatars}>
        {typists.slice(0, 3).map((t) => (
          <Avatar key={t.id} uri={t.avatar_url} label={(t.username?.[0] || '?').toUpperCase()} size={22} fontSize={10} style={styles.typingAvatar} />
        ))}
      </View>
      <View style={styles.typingBubble}>
        <TypingDots color={colors.textFaint} />
      </View>
    </Animated.View>
  );
}

export default function ChatView({ filterColumn, filterValue, participantsById, showSenderName }) {
  const { session } = useAuth();
  const { country } = useCountry();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const myId = session?.user?.id;
  const scrollRef = useRef(null);
  const channelRef = useRef(null);
  const lastTypingSentAtRef = useRef(0);
  const typingTimeoutsRef = useRef({});

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingIds, setTypingIds] = useState([]);

  const [mode, setMode] = useState('text');
  const [foodQuery, setFoodQuery] = useState('');
  const [calculations, setCalculations] = useState(null);
  const [loadingCalcs, setLoadingCalcs] = useState(false);
  const [openCalc, setOpenCalc] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq(filterColumn, filterValue)
        .order('created_at', { ascending: true })
        .limit(300);
      if (cancelled) return;
      setMessages(data || []);
      setLoading(false);

      const ids = (data || []).map((m) => m.id);
      if (ids.length > 0) {
        const { data: reactionRows } = await supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', ids);
        if (!cancelled) setReactions(reactionRows || []);
      }
    };
    load();

    const channel = supabase
      .channel(`messages-${filterColumn}-${filterValue}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `${filterColumn}=eq.${filterValue}` },
        (payload) => {
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `${filterColumn}=eq.${filterValue}` },
        (payload) => {
          setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
          setReactions((prev) => {
            const withoutThis = prev.filter((r) => r.id !== row.id);
            return payload.eventType === 'DELETE' ? withoutThis : [...withoutThis, payload.new];
          });
        },
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload?.userId || payload.userId === myId) return;
        const id = payload.userId;
        clearTimeout(typingTimeoutsRef.current[id]);
        setTypingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        typingTimeoutsRef.current[id] = setTimeout(() => {
          setTypingIds((prev) => prev.filter((existing) => existing !== id));
        }, TYPING_EXPIRE_MS);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      supabase.removeChannel(channel);
    };
  }, [filterColumn, filterValue, myId]);

  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length, typingIds.length, loading]);

  const insertMessage = async (payload) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: myId, [filterColumn]: filterValue, ...payload })
      .select()
      .single();
    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
    }
    return error;
  };

  const toggleReaction = async (messageId, emoji) => {
    setActiveMessageId(null);
    const mine = reactions.find((r) => r.message_id === messageId && r.user_id === myId);
    if (mine && mine.emoji === emoji) {
      setReactions((prev) => prev.filter((r) => r.id !== mine.id));
      await supabase.from('message_reactions').delete().eq('id', mine.id);
      return;
    }
    const optimistic = { id: mine?.id || `pending-${messageId}-${myId}`, message_id: messageId, user_id: myId, emoji };
    setReactions((prev) => [...prev.filter((r) => !(r.message_id === messageId && r.user_id === myId)), optimistic]);
    await supabase.from('message_reactions').upsert({ message_id: messageId, user_id: myId, emoji }, { onConflict: 'message_id,user_id' });
  };

  const deleteMessage = async (messageId) => {
    setActiveMessageId(null);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted_at: new Date().toISOString(), text: null, attachment: null, attachment_kind: null } : m)));
    await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', messageId);
  };

  const handleTextChange = (value) => {
    setText(value);
    if (!value.trim() || !channelRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentAtRef.current < TYPING_BROADCAST_THROTTLE_MS) return;
    lastTypingSentAtRef.current = now;
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: myId } });
  };

  const sendText = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const error = await insertMessage({ text: trimmed });
    if (!error) setText('');
    setSending(false);
  };

  const sendFood = async (food) => {
    setMode('text');
    setFoodQuery('');
    await insertMessage({
      attachment_kind: 'food',
      attachment: { name: food.name, kcal: food.kcal, protein: food.protein, fat: food.fat, carbs: food.carbs },
    });
  };

  const sendCalculation = async (calc) => {
    setMode('text');
    await insertMessage({
      attachment_kind: 'calculation',
      attachment: {
        label: calc.label,
        activity_label: calc.activity_label,
        activity_key: calc.activity_key,
        activity_factor: calc.activity_factor,
        formula_key: calc.formula_key,
        formula_label: calc.formula_label,
        sex: calc.sex,
        weight: calc.weight,
        height: calc.height,
        age: calc.age,
        tmb: calc.tmb,
        get: calc.get,
      },
    });
  };

  const openCalcPicker = async () => {
    setMode('pick-calc');
    if (calculations !== null) return;
    setLoadingCalcs(true);
    const { data } = await supabase
      .from('calculations')
      .select('*')
      .eq('user_id', myId)
      .order('created_at', { ascending: false })
      .limit(20);
    setCalculations(data || []);
    setLoadingCalcs(false);
  };

  const reactionsByMessage = useMemo(() => {
    const map = {};
    reactions.forEach((r) => {
      if (!map[r.message_id]) map[r.message_id] = [];
      map[r.message_id].push(r);
    });
    const counts = {};
    Object.entries(map).forEach(([messageId, rows]) => {
      const tally = {};
      rows.forEach((r) => { tally[r.emoji] = (tally[r.emoji] || 0) + 1; });
      counts[messageId] = Object.entries(tally).map(([emoji, count]) => ({ emoji, count }));
    });
    return counts;
  }, [reactions]);

  const foodResults = useMemo(() => {
    const q = foodQuery.trim().toLowerCase();
    if (!q) return [];
    const foods = DATASETS[country] || [];
    return foods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 20);
  }, [foodQuery, country]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messagesList}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.textFaint} />
            <Text style={styles.emptyText}>Todavía no hay mensajes. Escribe el primero.</Text>
          </View>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              mine={m.sender_id === myId}
              sender={participantsById?.[m.sender_id]}
              showSenderName={showSenderName}
              colors={colors}
              styles={styles}
              onOpenCalculation={setOpenCalc}
              reactionCounts={reactionsByMessage[m.id] || []}
              myEmoji={reactions.find((r) => r.message_id === m.id && r.user_id === myId)?.emoji || null}
              active={activeMessageId === m.id}
              onOpenActions={() => setActiveMessageId(m.id)}
              onCloseActions={() => setActiveMessageId(null)}
              onToggleReaction={(emoji) => toggleReaction(m.id, emoji)}
              onDelete={() => deleteMessage(m.id)}
            />
          ))
        )}
        <TypingIndicator
          typists={typingIds.map((id) => participantsById?.[id]).filter(Boolean)}
          colors={colors}
          styles={styles}
        />
      </ScrollView>

      {mode === 'attach-menu' && (
        <View style={styles.attachMenu}>
          <TouchableOpacity style={styles.attachMenuItem} onPress={() => setMode('pick-food')} accessibilityRole="button" accessibilityLabel="Compartir un alimento">
            <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
            <Text style={styles.attachMenuText}>Alimento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachMenuItem} onPress={openCalcPicker} accessibilityRole="button" accessibilityLabel="Compartir un cálculo">
            <Ionicons name="flash-outline" size={18} color={colors.primary} />
            <Text style={styles.attachMenuText}>Cálculo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachMenuClose} onPress={() => setMode('text')} accessibilityRole="button" accessibilityLabel="Cancelar">
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {mode === 'pick-food' && (
        <View style={styles.pickerPanel}>
          <View style={styles.pickerHeader}>
            <TextInput
              style={styles.pickerInput}
              placeholder="Buscar alimento..."
              placeholderTextColor={colors.placeholder}
              value={foodQuery}
              onChangeText={setFoodQuery}
              autoFocus
              accessibilityLabel="Buscar alimento para compartir"
            />
            <TouchableOpacity onPress={() => setMode('text')} accessibilityRole="button" accessibilityLabel="Cancelar">
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {foodResults.length === 0 ? (
              <Text style={styles.pickerHint}>{foodQuery.trim() ? 'Sin resultados.' : 'Escribe para buscar en tu tabla de alimentos.'}</Text>
            ) : (
              foodResults.map((f) => (
                <TouchableOpacity key={f.name} style={styles.pickerRow} onPress={() => sendFood(f)} accessibilityRole="button" accessibilityLabel={`Compartir ${f.name}`}>
                  <Text style={styles.pickerRowLabel} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.pickerRowValue}>{fmt(f.kcal)} kcal</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {mode === 'pick-calc' && (
        <View style={styles.pickerPanel}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Tus cálculos</Text>
            <TouchableOpacity onPress={() => setMode('text')} accessibilityRole="button" accessibilityLabel="Cancelar">
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {loadingCalcs ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
            ) : !calculations || calculations.length === 0 ? (
              <Text style={styles.pickerHint}>Todavía no tienes cálculos guardados.</Text>
            ) : (
              calculations.map((c) => (
                <TouchableOpacity key={c.id} style={styles.pickerRow} onPress={() => sendCalculation(c)} accessibilityRole="button" accessibilityLabel={`Compartir cálculo ${c.label || ''}`}>
                  <Text style={styles.pickerRowLabel} numberOfLines={1}>{c.label || 'Cálculo de gasto energético'}</Text>
                  <Text style={styles.pickerRowValue}>{fmt(c.get)} kcal</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {mode === 'text' && (
        <View style={styles.composer}>
          <TouchableOpacity style={styles.attachButton} onPress={() => setMode('attach-menu')} accessibilityRole="button" accessibilityLabel="Adjuntar alimento o cálculo">
            <Ionicons name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.placeholder}
            value={text}
            onChangeText={handleTextChange}
            multiline
            accessibilityLabel="Escribir mensaje"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendText}
            disabled={!text.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
          >
            {sending ? <ActivityIndicator size="small" color={colors.background} /> : <Ionicons name="arrow-up" size={18} color={colors.background} />}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
    <CalculationBreakdown visible={!!openCalc} calc={openCalc} onClose={() => setOpenCalc(null)} />
    </>
  );
}

const getStyles = (colors) => StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  messagesList: { padding: 16, paddingBottom: 8, gap: 8, flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', maxWidth: 220 },

  messageRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  messageRowMine: { justifyContent: 'flex-end' },
  messageCol: { maxWidth: '78%', gap: 4 },
  bubbleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bubbleRowMine: { flexDirection: 'row-reverse' },
  moreButton: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    flexShrink: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleDeleted: { opacity: 0.6 },
  senderName: { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  bubbleText: { fontSize: 14.5, color: colors.text, lineHeight: 20 },
  bubbleTextMine: { color: colors.background },
  bubbleTextDeleted: { fontSize: 13, color: colors.textFaint, fontStyle: 'italic' },
  bubbleTextDeletedMine: { color: colors.background, opacity: 0.85 },
  time: { fontSize: 9.5, color: colors.textFaint, marginTop: 4, alignSelf: 'flex-end' },
  timeMine: { color: colors.background, opacity: 0.75 },

  reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingLeft: 4 },
  reactionRowMine: { justifyContent: 'flex-end', paddingLeft: 0, paddingRight: 4 },
  reactionPill: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reactionPillMine: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  reactionPillText: { fontSize: 11.5, color: colors.text },

  reactionPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  reactionPickerMine: { alignSelf: 'flex-end' },
  reactionPickerEmoji: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  reactionPickerEmojiText: { fontSize: 17 },
  reactionPickerDelete: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    backgroundColor: colors.surfaceMuted,
  },
  reactionPickerClose: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  typingAvatars: { flexDirection: 'row' },
  typingAvatar: { marginRight: -8, borderWidth: 2, borderColor: colors.background },
  typingBubble: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 6,
  },

  attachCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
    gap: 4,
  },
  attachCardMine: { backgroundColor: 'rgba(255,255,255,0.18)' },
  attachHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attachTitle: { fontSize: 13, fontFamily: FONT_DISPLAY, color: colors.text, flexShrink: 1 },
  attachTitleMine: { color: colors.background },
  attachSub: { fontSize: 11, color: colors.textMuted },
  attachSubMine: { color: colors.background, opacity: 0.85 },
  macroRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  macroText: { fontSize: 10.5, color: colors.textMuted, fontWeight: '600' },
  attachTapHint: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  attachTapHintText: { fontSize: 9.5, color: colors.textFaint },

  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    maxHeight: 100,
    minHeight: 40,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },

  attachMenu: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  attachMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 40,
  },
  attachMenuText: { fontSize: 13, fontWeight: '700', color: colors.text },
  attachMenuClose: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },

  pickerPanel: { borderTopWidth: 1, borderTopColor: colors.border, maxHeight: 280 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, gap: 10 },
  pickerTitle: { fontSize: 14, fontFamily: FONT_DISPLAY, color: colors.text },
  pickerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 40,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  pickerList: { paddingHorizontal: 12 },
  pickerHint: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  pickerRowLabel: { fontSize: 13.5, color: colors.text, flex: 1 },
  pickerRowValue: { fontSize: 12, color: colors.primary, fontWeight: '700' },
});
