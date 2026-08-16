import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { CountryProvider } from './src/context/CountryContext';
import { AppAlertProvider } from './src/context/AppAlertContext';
import AuthScreen from './src/screens/AuthScreen';
import CalculatorScreen from './src/screens/CalculatorScreen';
import FoodsScreen from './src/screens/FoodsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const TABS = [
  { id: 'calculator', label: 'Calculadora', icon: 'calculator', Component: CalculatorScreen },
  { id: 'foods', label: 'Alimentos', icon: 'restaurant', Component: FoodsScreen },
  { id: 'history', label: 'Historial', icon: 'time', Component: HistoryScreen },
  { id: 'profile', label: 'Perfil', icon: 'person-circle', Component: ProfileScreen },
];

function MainApp() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState('calculator');

  const activeTabInfo = TABS.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabInfo.Component;

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{activeTabInfo.label}</Text>
      </View>

      <View style={styles.flex}>
        <ActiveComponent />
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

  return session ? <MainApp /> : <AuthScreen />;
}

function ThemedStatusBar() {
  const { resolvedScheme } = useTheme();
  return <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />;
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  tabButton: { flex: 1, minHeight: 56, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabButtonActive: { backgroundColor: colors.primarySoft },
  tabLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  tabLabelActive: { color: colors.primary },
});
