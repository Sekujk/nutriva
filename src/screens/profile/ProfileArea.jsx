import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, StyleSheet, View } from 'react-native';
import ProfileMenuScreen from './ProfileMenuScreen';
import ProfileInfoScreen from './ProfileInfoScreen';
import SettingsScreen from './SettingsScreen';
import AppearanceScreen from './AppearanceScreen';
import FaqScreen from './FaqScreen';
import AboutScreen from './AboutScreen';
import SuggestionsScreen from './SuggestionsScreen';
import ChangePasswordScreen from './ChangePasswordScreen';
import useResponsive from '../../hooks/useResponsive';

const SUB_SCREENS = {
  perfil: ProfileInfoScreen,
  configuracion: SettingsScreen,
  apariencia: AppearanceScreen,
  faq: FaqScreen,
  sobre: AboutScreen,
  sugerencias: SuggestionsScreen,
  contrasena: ChangePasswordScreen,
};

export default function ProfileArea({ onNavigate: onNavigateApp }) {
  const [subScreen, setSubScreen] = useState(null);
  const { isDesktop } = useResponsive();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fadeAnim.setValue(0);
    slideAnim.setValue(subScreen ? 16 : -16);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [subScreen]);

  useEffect(() => {
    const onBackPress = () => {
      if (subScreen) {
        setSubScreen(null);
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [subScreen]);

  const SubScreen = subScreen && SUB_SCREENS[subScreen];

  return (
    <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
        {SubScreen ? <SubScreen onBack={() => setSubScreen(null)} /> : <ProfileMenuScreen onNavigate={setSubScreen} onNavigateApp={onNavigateApp} />}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { flex: 1 },
  innerDesktop: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
});
