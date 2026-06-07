import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { radius, shadows, spacing } from '../theme/theme';

export default function Button({
  title,
  onPress,
  colors,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) {
  const styles = getStyles(colors);
  const isSecondary = variant === 'secondary';
  const backgroundColor = isSecondary ? 'transparent' : colors.primary;
  const textColor = isSecondary ? colors.textPrimary : colors.textInverted;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor: isSecondary ? colors.border : 'transparent',
          borderWidth: isSecondary ? 1 : 0,
        },
        !isSecondary && shadows.glow,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const getStyles = () => StyleSheet.create({
  button: {
    height: 50,
    borderRadius: radius.btn,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
  },
  text: {
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.45,
  },
});
