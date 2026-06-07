import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import MemberTabBar from '../components/MemberTabBar';
import DashboardScreen from '../screens/DashboardScreen';
import ToolsScreen from '../screens/ToolsScreen';
import DietScreen from '../screens/DietScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createMaterialTopTabNavigator();

/**
 * MainTabNavigator
 *
 * Uses MaterialTopTabNavigator backed by react-native-pager-view for native,
 * bug-free horizontal swipe between tabs. The built-in top tab bar is hidden;
 * the custom MemberTabBar is rendered at the bottom via the `tabBar` prop.
 *
 * swipeEnabled  → finger-swipe between tabs works naturally alongside ScrollView
 * lazy          → each screen mounts only on first visit (better performance)
 */
export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <MemberTabBar {...props} />}
      tabBarPosition="bottom"
      initialRouteName="Dashboard"
      screenOptions={{
        // Hide the default top tab bar — we use our custom bottom bar
        tabBarStyle: { display: 'none' },
        swipeEnabled: true,
        lazy: true,
        // Smooth spring-like animation powered by react-native-pager-view
        animationEnabled: true,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tools"     component={ToolsScreen} />
      <Tab.Screen name="Diet"      component={DietScreen} />
      <Tab.Screen name="Setting"   component={SettingsScreen} />
    </Tab.Navigator>
  );
}
