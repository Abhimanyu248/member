import 'react-native-gesture-handler'; // Must be the very first import
import React, { useEffect, useMemo, useState } from 'react';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { AppContext } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import { getThemeColors } from './src/theme/theme';
import { memberApi } from './src/utils/api';

const THEME_MODE_KEY = 'member_theme_mode';

function MemberApp() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  // True while we are silently checking the stored JWT on launch
  const [bootstrapping, setBootstrapping] = useState(true);

  const activeScheme = themeMode === 'system' ? systemScheme : themeMode;
  const colors = useMemo(() => getThemeColors(activeScheme), [activeScheme]);
  const isDarkMode = activeScheme === 'dark';

  // On app launch: restore theme and attempt JWT session restoration
  useEffect(() => {
    const bootstrap = async () => {
      // Restore theme preference
      const storedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
      if (storedMode === 'light' || storedMode === 'dark') {
        setThemeMode(storedMode);
      }

      // Restore phone field as fallback
      const storedPhone = await memberApi.getLastPhone();
      if (storedPhone) setPhone(storedPhone);

      // Silently try to restore the session using the saved JWT
      try {
        const data = await memberApi.getMe();
        if (data && data.member) {
          setProfile(data);
        }
      } catch {
        // Token expired or invalid — stay on login screen, no error shown
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  const updateThemeMode = async (nextMode) => {
    setThemeMode(nextMode);
    await AsyncStorage.setItem(THEME_MODE_KEY, nextMode);
  };

  const onThemeModeChange = (enabled) => {
    updateThemeMode(enabled ? 'dark' : 'light');
  };

  const onLookup = async () => {
    if (!phone.trim()) {
      setError('Enter your registered phone number.');
      return;
    }
    if (!password.trim()) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await memberApi.loginMember(phone, password);
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Member login failed.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    const currentPhone = profile?.member?.phone || phone;
    if (!currentPhone) return;

    setRefreshing(true);
    try {
      const data = await memberApi.lookupMember(currentPhone);
      setProfile(data);
      setPhone(String(currentPhone));
      setError('');
    } catch (err) {
      setError(err.message || 'Could not refresh member details.');
    } finally {
      setRefreshing(false);
    }
  };

  const onLogout = async () => {
    // Clear both phone and JWT token from storage
    await memberApi.clearSession();
    setProfile(null);
    setPhone('');
    setPassword('');
    setError('');
  };

  // Show a full-screen loader while silently verifying the token
  if (bootstrapping) {
    return (
      <SafeAreaProvider style={{ backgroundColor: colors.background }}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  const contextValue = {
    colors,
    profile,
    isDarkMode,
    loading,
    refreshing,
    error,
    phone,
    password,
    setPhone,
    setPassword,
    onLookup,
    onRefresh,
    onLogout,
    onThemeModeChange,
  };

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppContext.Provider value={contextValue}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}

export default MemberApp;
