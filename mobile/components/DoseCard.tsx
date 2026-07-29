import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, X, Clock } from 'lucide-react-native';

interface DoseCardProps {
  medicineName: string;
  memberName: string;
  time: string;
  dosage: string;
  mealInstruction: string;
  status?: 'taken' | 'missed' | 'upcoming';
  onTake?: () => void;
  onMiss?: () => void;
}

export function DoseCard({ medicineName, memberName, time, dosage, mealInstruction, status = 'upcoming', onTake, onMiss }: DoseCardProps) {
  return (
    <View style={[styles.card, status === 'taken' ? styles.takenCard : status === 'missed' ? styles.missedCard : null]}>
      <View style={styles.timeBadge}>
        <Clock size={14} color="#0f766e" />
        <Text style={styles.timeText}>{time}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.medicineName}>{medicineName}</Text>
        <Text style={styles.details}>{dosage} • {mealInstruction}</Text>
        <Text style={styles.memberName}>{memberName}</Text>
      </View>
      {status === 'upcoming' ? (
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={onTake} style={[styles.btn, styles.takeBtn]}>
            <Check size={18} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onMiss} style={[styles.btn, styles.missBtn]}>
            <X size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.statusBadge, status === 'taken' ? styles.statusTaken : styles.statusMissed]}>
          <Text style={[styles.statusBadgeText, status === 'taken' ? styles.statusTakenText : styles.statusMissedText]}>
            {status.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  takenCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  missedCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  info: {
    flex: 1,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  details: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  memberName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f766e',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeBtn: {
    backgroundColor: '#0f766e',
  },
  missBtn: {
    backgroundColor: '#fee2e2',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTaken: {
    backgroundColor: '#dcfce7',
  },
  statusTakenText: {
    color: '#15803d',
  },
  statusMissed: {
    backgroundColor: '#fee2e2',
  },
  statusMissedText: {
    color: '#b91c1c',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
