import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pill, Trash2 } from 'lucide-react-native';
import type { Medicine } from '../lib/types';
import { daysUntil, formatExpiryStatus } from '../lib/date-utils';

interface MedicineCardProps {
  medicine: Medicine;
  memberName?: string;
  onDelete?: (id: string) => void;
  onEditQuantity?: (id: string, newQty: number) => void;
}

export function MedicineCard({ medicine, memberName, onDelete, onEditQuantity }: MedicineCardProps) {
  const daysLeft = daysUntil(medicine.expiryDate);
  const isExpiringSoon = isFinite(daysLeft) && daysLeft >= 0 && daysLeft <= 30;
  const isLowStock = medicine.quantity <= medicine.lowStockAt;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Pill size={22} color="#0f766e" />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{medicine.name}</Text>
          <Text style={styles.subtext}>
            {medicine.strength ? `${medicine.strength} • ` : ''}{medicine.type}
            {medicine.use ? ` • ${medicine.use}` : ''}
          </Text>
          {memberName ? <Text style={styles.memberText}>Assigned: {memberName}</Text> : null}
        </View>
        {onDelete ? (
          <TouchableOpacity onPress={() => onDelete(medicine.id)} style={styles.deleteButton}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>Stock: {medicine.quantity} {medicine.unit}</Text>
        </View>
        {isLowStock ? (
          <View style={[styles.badge, styles.lowStockBadge]}>
            <Text style={styles.lowStockText}>Low Stock</Text>
          </View>
        ) : null}
        {isExpiringSoon ? (
          <View style={[styles.badge, styles.expiringBadge]}>
            <Text style={styles.expiringText}>Expiring Soon</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Expiry:</Text>
        <Text style={[styles.metaValue, isExpiringSoon ? styles.metaValueUrgent : null]}>
          {medicine.expiryDate ? medicine.expiryDate : 'No expiry set'}
        </Text>
        <Text style={styles.statusText}> ({formatExpiryStatus(medicine.expiryDate)})</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  memberText: {
    fontSize: 12,
    color: '#0f766e',
    fontWeight: '600',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  qtyBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockBadge: {
    backgroundColor: '#fee2e2',
  },
  lowStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b91c1c',
  },
  expiringBadge: {
    backgroundColor: '#ffedd5',
  },
  expiringText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c2410c',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 4,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  metaValueUrgent: {
    color: '#c2410c',
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
  },
});
