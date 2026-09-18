import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../theme/ThemeContext';
import SubScreenHeader from '../profile/SubScreenHeader';
import ChatView from './ChatView';

export default function FriendChatScreen({ friend, friendshipId, onBack }) {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const participantsById = useMemo(() => {
    const map = { [friend.id]: friend };
    if (session?.user?.id && profile) map[session.user.id] = profile;
    return map;
  }, [friend, session, profile]);

  return (
    <View style={styles.flex}>
      <View style={styles.headerWrapper}>
        <SubScreenHeader
          title={<Text>{friend.username}<Text style={styles.tag}>#{friend.tag}</Text></Text>}
          onBack={onBack}
        />
      </View>
      <ChatView filterColumn="friendship_id" filterValue={friendshipId} participantsById={participantsById} showSenderName={false} />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  flex: { flex: 1 },
  headerWrapper: { paddingHorizontal: 20, paddingTop: 16 },
  tag: { fontSize: 14, fontWeight: '500', color: colors.textFaint },
});
