import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { DoseCard } from '../../components/DoseCard';
import { useAppStore } from '../../lib/app-store';
import { Clock } from 'lucide-react-native';
import { getLocalTodayString } from '../../lib/date-utils';

export default function RemindersScreen() {
  const { medicines, members, reminderLogs, markDose } = useAppStore();

  // Create demo dose schedule from active medicines
  const todayStr = getLocalTodayString();
  const demoDoses = medicines.flatMap((med) => {
    const member = members.find((m) => m.id === med.assignedToId);
    return (med.reminderTimes || ['09:00']).map((t, idx) => {
      const doseId = `${med.id}-${todayStr}-${t}-${idx}`;
      return {
        id: doseId,
        medicineId: med.id,
        medicineName: med.name,
        memberName: member?.name || 'Unassigned',
        time: t,
        dosage: med.dosage,
        mealInstruction: med.mealInstruction,
        status: reminderLogs.find((r) => r.id === doseId)?.status || 'upcoming',
      };
    });
  }).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Pill Reminders" subtitle="Today's dose schedule and logs" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color="#0f766e" />
          <Text style={styles.sectionTitle}>Today's Schedule ({demoDoses.length} doses)</Text>
        </View>

        {demoDoses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No reminder schedules set for today.</Text>
          </View>
        ) : (
          demoDoses.map((dose) => (
            <DoseCard
              key={dose.id}
              medicineName={dose.medicineName}
              memberName={dose.memberName}
              time={dose.time}
              dosage={dose.dosage}
              mealInstruction={dose.mealInstruction}
              status={dose.status as any}
              onTake={() => markDose(dose.id, 'taken', dose.medicineId, dose.dosage)}
              onMiss={() => markDose(dose.id, 'missed')}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
