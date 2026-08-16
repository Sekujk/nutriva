import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, BackHandler,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { CountryProvider } from './src/context/CountryContext';
import { AppAlertProvider } from './src/context/AppAlertContext';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingFlow from './src/screens/onboarding/OnboardingFlow';
import HomeScreen from './src/screens/HomeScreen';
import CalculatorScreen from './src/screens/CalculatorScreen';
import FoodsScreen from './src/screens/FoodsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileArea from './src/screens/profile/ProfileArea';

const TABS = [
  { id: 'home', label: 'Inicio', icon: 'home', Component: HomeScreen },
  { id: 'calculator', label: 'Calculadora', icon: 'calculator', Component: CalculatorScreen },
  { id: 'foods', label: 'Alimentos', icon: 'restaurant', Component: FoodsScreen },
  { id: 'history', label: 'Historial', icon: 'time', Component: HistoryScreen },
];

const PROFILE_SCREEN = { id: 'profile', label: 'Perfil', icon: 'person-circle', Component: ProfileArea };

const ALL_SCREENS = [...TABS, PROFILE_SCREEN];

function MainApp() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState('home');

  const activeTabInfo = ALL_SCREENS.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabInfo.Component;

  const email = session?.user?.email || '';
  const username = session?.user?.user_metadata?.username || '';
  const onProfile = activeTab === 'profile';

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fadeAnim.setValue(0);
    slideAnim.setValue(14);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [activeTab]);

  useEffect(() => {
    const onBackPress = () => {
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.hero}>
        <View style={[styles.blobLarge, { backgroundColor: colors.primarySoft, opacity: 0.5 }]} />
        <View style={[styles.blobSmall, { backgroundColor: colors.background, opacity: 0.1 }]} />

        <Animated.View style={[styles.heroLeft, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.heroBadge}>
            <Ionicons name={activeTabInfo.icon} size={22} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>{activeTabInfo.label}</Text>
        </Animated.View>

        <TouchableOpacity
          style={[styles.profileCircle, onProfile && styles.profileCircleActive]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Perfil"
        >
          <Text style={[styles.profileInitial, onProfile && styles.profileInitialActive]}>
            {(username[0] || email[0] || '?').toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Animated.View style={[styles.cardContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ActiveComponent onNavigate={setActiveTab} />
        </Animated.View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, active && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
            >
              <Ionicons
                name={active ? tab.icon : `${tab.icon}-outline`}
                size={22}
                color={active ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function Root() {
  const { session, isLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  const needsOnboarding = session.user?.user_metadata?.onboarding_complete !== true;
  return needsOnboarding ? <OnboardingFlow /> : <MainApp />;
}

function ThemedStatusBar() {
  return <StatusBar style="light" />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CountryProvider>
          <AppAlertProvider>
            <AuthProvider>
              <ThemedStatusBar />
              <Root />
            </AuthProvider>
          </AppAlertProvider>
        </CountryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const getStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  blobLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -80,
    right: -50,
  },
  blobSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -60,
    left: -30,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.background, letterSpacing: -0.4 },

  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  profileCircleActive: { backgroundColor: '#000000', borderColor: colors.background },
  profileInitial: { fontSize: 17, fontWeight: '800', color: colors.primary },
  profileInitialActive: { color: colors.primary },

  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    overflow: 'hidden',
  },
  cardContent: { flex: 1 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 20,
    padding: 6,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  tabButton: { flex: 1, minHeight: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 2 },
  tabButtonActive: { backgroundColor: colors.primarySoft },
  tabLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  tabLabelActive: { color: colors.primary },
});
