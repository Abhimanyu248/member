import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppContext } from '../context/AppContext';

import LookupScreen from '../screens/LookupScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator();

/**
 * RootNavigator
 *
 * Switches between the Login screen and the authenticated Main app
 * based on whether `profile` exists in AppContext.
 *
 * Using a NativeStack means the Login→Dashboard transition is a clean
 * native slide — no layout flicker from conditional rendering in App.js.
 */
export default function RootNavigator() {
  const { profile, colors, loading, error, phone, setPhone, password, setPassword, onLookup } =
    useAppContext();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {profile ? (
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Login">
          {() => (
            <LookupScreen
              colors={colors}
              onLookup={onLookup}
              loading={loading}
              error={error}
              phone={phone}
              setPhone={setPhone}
              password={password}
              setPassword={setPassword}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
