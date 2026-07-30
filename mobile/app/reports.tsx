import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../lib/app-store';
import { ChevronLeft, BarChart2 } from 'lucide-react-native';

export default function ReportsScreen() {
  const router = useRouter();
  const { medicines, members, todayReminders, lowStockMedicines, expiringMedicines } = useAppStore();
  
  const taken = todayReminders.filter((item) => item.status === 'taken').length;
  const adherence = todayReminders.length ? Math.round((taken / todayReminders.length) * 100) : 0;
  
  // Create a unique list of attention medicines
  const attentionMedicinesMap = new Map();
  [...lowStockMedicines, ...expiringMedicines].forEach(m => attentionMedicinesMap.set(m.id, m));
  const attentionMedicines = Array.from(attentionMedicinesMap.values());

  const ReportCard = ({ label, value }: { label: string, value: string | number }) => (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Monthly household medicine summary.</Text>

        <View style={styles.statsGrid}>
          <ReportCard label="Family Members" value={members.length} />
          <ReportCard label="Medicines Tracked" value={medicines.length} />
          <ReportCard label="Dose Adherence" value={`${adherence}%`} />
          <ReportCard label="Needs Attention" value={attentionMedicines.length} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Medicine Distribution</Text>
          <View style={styles.distributionList}>
            {members.map((member) => {
              const count = medicines.filter((m) => m.assignedToId === member.id).length;
              const percentage = medicines.length > 0 ? Math.max(8, (count / medicines.length) * 100) : 0;
              
              return (
                <View key={member.id} style={styles.distRow}>
                  <View style={styles.distHeader}>
                    <Text style={styles.distName}>{member.name}</Text>
                    <Text style={styles.distCount}>{count} medicines</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${percentage}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Attention List</Text>
          {attentionMedicines.length === 0 ? (
            <Text style={styles.emptyText}>All good! No medicines need attention right now.</Text>
          ) : (
            <View style={styles.attentionList}>
              {attentionMedicines.map((medicine) => (
                <View key={medicine.id} style={styles.attentionItem}>
                  <View style={styles.attentionInfo}>
                    <Text style={styles.attentionName}>{medicine.name}</Text>
                    <Text style={styles.attentionSub}>{medicine.quantity} {medicine.unit} left • expires {medicine.expiryDate}</Text>
                  </View>
                  <View style={styles.reviewBadge}>
                    <Text style={styles.reviewText}>Review</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 16 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  
  distributionList: { gap: 16 },
  distRow: {},
  distHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  distName: { fontSize: 14, fontWeight: '600', color: '#334155' },
  distCount: { fontSize: 13, color: '#64748b' },
  barBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#0f766e', borderRadius: 4 },
  
  attentionList: { gap: 12 },
  attentionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  attentionInfo: { flex: 1 },
  attentionName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  attentionSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  reviewBadge: { backgroundColor: '#ffedd5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  reviewText: { color: '#c2410c', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#64748b', fontSize: 14, fontStyle: 'italic' },
});
