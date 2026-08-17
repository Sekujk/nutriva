import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, StyleSheet, View } from 'react-native';
import FriendsScreen from './FriendsScreen';
import GroupsScreen from './GroupsScreen';
import GroupDetailScreen from './GroupDetailScreen';
import useResponsive from '../../hooks/useResponsive';

export default function FriendsArea() {
  const [view, setView] = useState({ screen: 'amigos' });
  const { isDesktop } = useResponsive();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);
  const prevScreen = useRef(view.screen);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const goingDeeper = view.screen !== 'amigos' && prevScreen.current === 'amigos';
    const goingBack = view.screen === 'amigos' && prevScreen.current !== 'amigos';
    fadeAnim.setValue(0);
    slideAnim.setValue(goingBack ? -16 : goingDeeper ? 16 : 16);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
    prevScreen.current = view.screen;
  }, [view]);

  useEffect(() => {
    const onBackPress = () => {
      if (view.screen === 'grupo') {
        setView({ screen: 'grupos' });
        return true;
      }
      if (view.screen === 'grupos') {
        setView({ screen: 'amigos' });
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [view]);

  let content;
  if (view.screen === 'grupo') {
    content = (
      <GroupDetailScreen
        groupId={view.groupId}
        groupName={view.groupName}
        onBack={() => setView({ screen: 'grupos' })}
        onGroupDeleted={() => setView({ screen: 'grupos' })}
      />
    );
  } else if (view.screen === 'grupos') {
    content = (
      <GroupsScreen
        onBack={() => setView({ screen: 'amigos' })}
        onOpenGroup={(groupId, groupName) => setView({ screen: 'grupo', groupId, groupName })}
      />
    );
  } else {
    content = <FriendsScreen onOpenGroups={() => setView({ screen: 'grupos' })} />;
  }

  return (
    <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
        {content}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { flex: 1 },
  innerDesktop: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
});
