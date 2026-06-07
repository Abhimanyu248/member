import React from 'react';
import { Text, View } from 'react-native';

import { getMemberStyles } from '../styles/memberStyles';

export default function InfoRow({ Icon, label, value, colors }) {
  const styles = getMemberStyles(colors);

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon color={colors.accent} size={20} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} selectable>
          {value || '-'}
        </Text>
      </View>
    </View>
  );
}
