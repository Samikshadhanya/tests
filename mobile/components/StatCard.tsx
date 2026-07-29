import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  label: string;
  value: number | string;
  highlight?: boolean;
}

export function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <View style={[styles.card, highlight ? styles.cardHighlight : null]}>
      <Text style={[styles.value, highlight ? styles.valueHighlight : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHighlight: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  valueHighlight: {
    color: '#dc2626',
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
});
