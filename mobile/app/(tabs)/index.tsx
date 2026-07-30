import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { MedicineCard } from '../../components/MedicineCard';
import { AddMedicineModal } from '../../components/AddMedicineModal';
import { useAppStore } from '../../lib/app-store';
import { Plus, ShieldAlert, Heart, Phone, Calendar, ShoppingCart, BarChart2, FileText } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user, medicines, members, lowStockMedicines, expiringMedicines, todayReminders, deleteMedicine } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const isElderMode = user.elderMode;

  if (isElderMode) {
    return (
      <SafeAreaView style={styles.elderContainer} edges={['top']}>
        <View style={styles.elderHeader}>
          <Text style={styles.elderTitle}>Hello, {user.name}</Text>
          <Text style={styles.elderSubtitle}>Elderly Care Dashboard</Text>
        </View>

        <ScrollView contentContainerStyle={styles.elderScroll}>
          <TouchableOpacity style={styles.sosBigButton} onPress={() => Linking.openURL('tel:121')}>
            <ShieldAlert size={48} color="#ffffff" />
            <Text style={styles.sosBigText}>EMERGENCY SOS</Text>
            <Text style={styles.sosSubText}>Tap to call emergency helpline (121)</Text>
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Heart size={24} color="#0f766e" />
            <Text style={styles.sectionTitleLarge}>Today's Medicines</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.elderAddBtn} onPress={() => setModalVisible(true)}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addBtnText}>Add Pill</Text>
            </TouchableOpacity>
          </View>

          {medicines.map((med) => (
            <View key={med.id} style={styles.elderMedCard}>
              <Text style={styles.elderMedName}>{med.name}</Text>
              <Text style={styles.elderMedDetails}>{med.dosage} • {med.mealInstruction}</Text>
              <Text style={styles.elderMedTime}>Time: {med.reminderTimes?.[0] || '09:00 AM'}</Text>
            </View>
          ))}

          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Calendar size={24} color="#0f766e" />
            <Text style={styles.sectionTitleLarge}>Upcoming Reminders</Text>
          </View>

          {todayReminders.filter(r => r.status === 'upcoming').map((reminder) => {
            const med = medicines.find(m => m.id === reminder.medicineId);
            if (!med) return null;
            return (
              <View key={reminder.id} style={styles.elderReminderCard}>
                <Text style={styles.elderMedTime}>{reminder.time}</Text>
                <Text style={styles.elderMedName}>{med.name}</Text>
              </View>
            );
          })}
        </ScrollView>
        <AddMedicineModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="MedHome" subtitle={`Household: ${user.household}`} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsRow}>
          <StatCard label="Medicines" value={medicines.length} />
          <StatCard label="Low Stock" value={lowStockMedicines.length} highlight={lowStockMedicines.length > 0} />
          <StatCard label="Expiring" value={expiringMedicines.length} highlight={expiringMedicines.length > 0} />
          <StatCard label="Members" value={members.length} />
        </View>

        <View style={styles.quickToolsContainer}>
          <Text style={styles.sectionTitle}>Quick Tools</Text>
          <View style={styles.quickToolsGrid}>
            <TouchableOpacity style={styles.quickToolBtn} onPress={() => router.push('/appointments')}>
              <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                <Calendar size={22} color="#0284c7" />
              </View>
              <Text style={styles.quickToolText}>Appointments</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickToolBtn} onPress={() => router.push('/purchase-list')}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <ShoppingCart size={22} color="#d97706" />
              </View>
              <Text style={styles.quickToolText}>Purchase List</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickToolBtn} onPress={() => router.push('/reports')}>
              <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
                <BarChart2 size={22} color="#9333ea" />
              </View>
              <Text style={styles.quickToolText}>Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickToolBtn} onPress={() => router.push('/export')}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <FileText size={22} color="#16a34a" />
              </View>
              <Text style={styles.quickToolText}>Export Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Text style={styles.sectionTitle}>Active Inventory</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>Add Pill</Text>
          </TouchableOpacity>
        </View>

        {medicines.map((med) => {
          const member = members.find((m) => m.id === med.assignedToId);
          return (
            <MedicineCard
              key={med.id}
              medicine={med}
              memberName={member?.name}
              onDelete={(id) => deleteMedicine(id)}
            />
          );
        })}
      </ScrollView>

      <AddMedicineModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  quickToolsContainer: {
    marginBottom: 20,
  },
  quickToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  quickToolBtn: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickToolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f766e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  elderContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  elderHeader: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#ccfbf1',
  },
  elderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  elderSubtitle: {
    fontSize: 16,
    color: '#0f766e',
    fontWeight: '600',
    marginTop: 4,
  },
  elderScroll: {
    padding: 20,
  },
  sosBigButton: {
    backgroundColor: '#dc2626',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sosBigText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sosSubText: {
    color: '#fee2e2',
    fontSize: 14,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitleLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  elderMedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#99f6e4',
  },
  elderMedName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  elderMedDetails: {
    fontSize: 16,
    color: '#475569',
    marginTop: 4,
  },
  elderMedTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f766e',
    marginTop: 8,
  },
  elderAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f766e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  elderReminderCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
