import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Settings, Utensils, Wrench } from 'lucide-react-native';
import { getMemberStyles } from '../styles/memberStyles';
import { useAppContext } from '../context/AppContext';

const TABS = [
  { key: 'Dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'Tools',     label: 'Tools',     Icon: Wrench },
  { key: 'Diet',      label: 'Diet',      Icon: Utensils },
  { key: 'Setting',   label: 'Setting',   Icon: Settings },
];

/**
 * Custom bottom tab bar wired to React Navigation's material-top-tabs navigator.
 * Receives `navigation` and `state` from the navigator via the `tabBar` prop.
 */
export default function MemberTabBar({ navigation, state }) {
  const { colors } = useAppContext();
  const styles = getMemberStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarShell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.tabBar}>
        {TABS.map(({ key, label, Icon }, index) => {
          const isActive = state.index === index;
          const color = isActive ? colors.textInverted : colors.textMuted;

          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => navigation.navigate(key)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Icon color={color} size={20} strokeWidth={2.4} />
              <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
