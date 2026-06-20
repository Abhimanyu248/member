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
import CustomAlert from './src/components/CustomAlert';
import GlobalLoader from './src/components/GlobalLoader';

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
  const [multiGymProfiles, setMultiGymProfiles] = useState([]);
  // True while we are silently checking the stored JWT on launch
  const [bootstrapping, setBootstrapping] = useState(true);

  // Global loader state (only triggered on pull-to-refresh)
  const [globalLoading, setGlobalLoading] = useState(false);

  // Global Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const showAlert = ({ title, message, type = 'info', buttons = [] }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

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
    setMultiGymProfiles([]);
    try {
      const data = await memberApi.loginMember(phone, password);
      if (data && data.isMultiGym) {
        setMultiGymProfiles(data.profiles);
        setLoading(false);
        return;
      }
      // Fetch the full profile details (including payments and summary) after token is generated
      const fullProfile = await memberApi.getMe();
      setProfile(fullProfile);
    } catch (err) {
      setError(err.message || 'Member login failed.');
    } finally {
      setLoading(false);
    }
  };

  const onSelectGym = async (memberId) => {
    setLoading(true);
    setError('');
    try {
      const data = await memberApi.loginMember(phone, password, memberId);
      const fullProfile = await memberApi.getMe();
      setProfile(fullProfile);
      setMultiGymProfiles([]);
    } catch (err) {
      setError(err.message || 'Member login failed.');
    } finally {
      setLoading(false);
    }
  };

  const onCancelGymSelection = () => {
    setMultiGymProfiles([]);
    setError('');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await memberApi.getMe();
      if (data) {
        setProfile(data);
        if (data.member && data.member.phone) {
          setPhone(String(data.member.phone));
        }
      }
      setError('');
    } catch (err) {
      const errMsg = err.message || 'Could not refresh member details.';
      setError(errMsg);
      showAlert({
        title: 'Refresh Failed',
        message: errMsg,
        type: 'error',
      });
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
    setLoading,
    globalLoading,
    setGlobalLoading,
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
    showAlert,
    hideAlert,
    multiGymProfiles,
    onSelectGym,
    onCancelGymSelection,
  };

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppContext.Provider value={contextValue}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
        <GlobalLoader />
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}

export default MemberApp;
