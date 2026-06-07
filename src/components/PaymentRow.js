import React from 'react';
import { Text, View } from 'react-native';

import { getMemberStyles } from '../styles/memberStyles';
import { formatDate, formatMoney } from '../utils/memberUtils';

export default function PaymentRow({ payment, colors }) {
  const styles = getMemberStyles(colors);

  return (
    <View style={styles.paymentRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.paymentDate}>{formatDate(payment.paidOn || payment.createdAt)}</Text>
        <Text style={styles.paymentMeta}>{(payment.paymentMethod || 'cash').toUpperCase()}</Text>
        {payment.notes ? <Text style={styles.paymentMeta}>{payment.notes}</Text> : null}
      </View>
      <Text style={styles.paymentAmount}>{formatMoney(payment.amount)}</Text>
    </View>
  );
}
