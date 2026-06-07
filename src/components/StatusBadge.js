import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius } from '../theme/theme';

export default function StatusBadge({ status, colors }) {
  const styles = getStyles();
  const toneColor =
    status?.tone === 'danger'
      ? colors.danger
      : status?.tone === 'warning'
        ? colors.warning
        : status?.tone === 'success'
          ? colors.success
          : colors.textMuted;

  return (
    <View style={[styles.badge, { backgroundColor: `${toneColor}22`, borderColor: `${toneColor}40` }]}>
      <View style={[styles.dot, { backgroundColor: toneColor }]} />
      <Text style={[styles.text, { color: toneColor }]}>{(status?.label || 'Unknown').toUpperCase()}</Text>
    </View>
  );
}

const getStyles = () => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
