import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, BackHandler, ScrollView,
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
import Hoverable from './src/components/Hoverable';
import HeroBadge from './src/components/HeroBadge';
import useResponsive from './src/hooks/useResponsive';
import { useAppFonts, FONT_DISPLAY } from './src/theme/typography';

const TABS = [
  { id: 'home', label: 'Inicio', icon: 'home', Component: HomeScreen },
  { id: 'calculator', label: 'Calculadora', icon: 'calculator', Component: CalculatorScreen },
  { id: 'foods', label: 'Alimentos', icon: 'restaurant', Component: FoodsScreen },
  { id: 'history', label: 'Historial', icon: 'time', Component: HistoryScreen },
];

const PROFILE_SCREEN = { id: 'profile', label: 'Perfil', icon: 'person-circle', Component: ProfileArea };

const ALL_SCREENS = [...TABS, PROFILE_SCREEN];

function useActiveTabAnimation(activeTab) {
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

  return { fadeAnim, slideAnim };
}

function DesktopShell({ activeTab, setActiveTab, activeTabInfo, ActiveComponent, colors, styles, username, email }) {
  const { fadeAnim, slideAnim } = useActiveTabAnimation(activeTab);

  return (
    <View style={styles.desktopRoot}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarBrand}>
          <HeroBadge icon="leaf" size={38} iconSize={18} />
          <Text style={styles.sidebarBrandText}>Nutriva</Text>
        </View>

        <View style={styles.sidebarNav}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Hoverable key={tab.id} scaleTo={1}>
                {({ hovered }) => (
                  <TouchableOpacity
                    style={[styles.sidebarItem, active && styles.sidebarItemActive, !active && hovered && styles.sidebarItemHovered]}
                    onPress={() => setActiveTab(tab.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={tab.label}
                  >
                    <Ionicons
                      name={active ? tab.icon : `${tab.icon}-outline`}
                      size={20}
                      color={active ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                )}
              </Hoverable>
            );
          })}
        </View>

        <Hoverable scaleTo={1}>
          {({ hovered }) => (
            <TouchableOpacity
              style={[styles.sidebarProfile, activeTab === 'profile' && styles.sidebarItemActive, activeTab !== 'profile' && hovered && styles.sidebarItemHovered]}
              onPress={() => setActiveTab('profile')}
              accessibilityRole="button"
              accessibilityLabel="Perfil"
            >
              <View style={styles.sidebarAvatar}>
                <Text style={styles.sidebarAvatarInitial}>{(username[0] || email[0] || '?').toUpperCase()}</Text>
              </View>
              <View style={styles.sidebarProfileTextCol}>
                <Text style={styles.sidebarProfileName} numberOfLines={1}>{username || 'Perfil'}</Text>
                {!!username && <Text style={styles.sidebarProfileEmail} numberOfLines={1}>{email}</Text>}
              </View>
            </TouchableOpacity>
          )}
        </Hoverable>
      </View>

      <View style={styles.desktopMain}>
        <View style={styles.desktopHeader}>
          <View style={styles.desktopHeaderBadge}>
            <Ionicons name={activeTabInfo.icon} size={20} color={colors.primary} />
          </View>
          <Text style={styles.desktopHeaderTitle}>{activeTabInfo.label}</Text>
        </View>

        <ScrollView style={styles.desktopContentScroll} contentContainerStyle={styles.desktopContentScrollInner}>
          <Animated.View
            style={[
              styles.desktopContentInner,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <ActiveComponent onNavigate={setActiveTab} />
          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );
}

function MobileShell({ activeTab, setActiveTab, activeTabInfo, ActiveComponent, colors, styles, username, email }) {
  const { fadeAnim, slideAnim } = useActiveTabAnimation(activeTab);
  const onProfile = activeTab === 'profile';

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.hero}>
        <View style={[styles.blobLarge, { backgroundColor: colors.primarySoft, opacity: 0.5 }]} />
        <View style={[styles.blobSmall, { backgroundColor: colors.background, opacity: 0.1 }]} />

        <Animated.View style={[styles.heroLeft, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <HeroBadge icon={activeTabInfo.icon} size={44} iconSize={22} />
          <Text style={styles.heroTitle}>{activeTabInfo.label}</Text>
        </Animated.View>

        <Hoverable scaleTo={1.08}>
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
        </Hoverable>
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
            <Hoverable key={tab.id} scaleTo={1.06} style={styles.tabButtonWrapper}>
              {({ hovered }) => (
                <TouchableOpacity
                  style={[styles.tabButton, active && styles.tabButtonActive, !active && hovered && styles.tabButtonHovered]}
                  onPress={() => setActiveTab(tab.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={tab.label}
                >
                  <Ionicons
                    name={active ? tab.icon : `${tab.icon}-outline`}
                    size={22}
                    color={active || hovered ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.tabLabel, (active || hovered) && styles.tabLabelActive]} numberOfLines={1}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              )}
            </Hoverable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function MainApp() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState('home');

  const activeTabInfo = ALL_SCREENS.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabInfo.Component;

  const email = session?.user?.email || '';
  const username = session?.user?.user_metadata?.username || '';

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

  const sharedProps = { activeTab, setActiveTab, activeTabInfo, ActiveComponent, colors, styles, username, email };

  return isDesktop ? <DesktopShell {...sharedProps} /> : <MobileShell {...sharedProps} />;
}

function Root() {
  const { session, isLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const fontsLoaded = useAppFonts();

  if (isLoading || !fontsLoaded) {
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
  heroTitle: { fontSize: 25, fontFamily: FONT_DISPLAY, color: colors.background, letterSpacing: -0.2 },

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
  tabButtonWrapper: { flex: 1 },
  tabButton: { minHeight: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 2 },
  tabButtonActive: { backgroundColor: colors.primarySoft },
  tabButtonHovered: { backgroundColor: colors.surfaceMuted },
  tabLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  tabLabelActive: { color: colors.primary },

  // Desktop shell
  desktopRoot: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  sidebar: {
    width: 264,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 24,
    paddingHorizontal: 18,
    justifyContent: 'flex-start',
  },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32, paddingHorizontal: 6 },
  sidebarBrandText: { fontSize: 20, fontFamily: FONT_DISPLAY, color: colors.text, letterSpacing: -0.2 },
  sidebarNav: { gap: 4, flex: 1 },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  sidebarItemActive: { backgroundColor: colors.primarySoft },
  sidebarItemHovered: { backgroundColor: colors.surfaceMuted },
  sidebarItemText: { fontSize: 14.5, fontWeight: '600', color: colors.textMuted },
  sidebarItemTextActive: { color: colors.primary, fontWeight: '700' },
  sidebarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  sidebarAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  sidebarAvatarInitial: { fontSize: 14, fontWeight: '800', color: colors.primary },
  sidebarProfileTextCol: { flex: 1 },
  sidebarProfileName: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  sidebarProfileEmail: { fontSize: 11, color: colors.textFaint, marginTop: 1 },

  desktopMain: { flex: 1 },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  desktopHeaderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopHeaderTitle: { fontSize: 20, fontFamily: FONT_DISPLAY, color: colors.text, letterSpacing: -0.2 },
  desktopContentScroll: { flex: 1 },
  desktopContentScrollInner: { flexGrow: 1, alignItems: 'center' },
  desktopContentInner: { width: '100%', maxWidth: 880, paddingHorizontal: 8 },
});
