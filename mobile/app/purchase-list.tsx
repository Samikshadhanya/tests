import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../lib/app-store';
import { ChevronLeft, ShoppingCart, Search } from 'lucide-react-native';
import { daysUntil } from '../lib/date-utils';

export default function PurchaseListScreen() {
  const router = useRouter();
  const { purchaseList, getMember, updateMedicine } = useAppStore();

  const handleRestock = (medicine: any) => {
    const isExpired = daysUntil(medicine.expiryDate) < 0;
    const updates: any = { quantity: medicine.quantity + 30 };
    if (isExpired) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      updates.expiryDate = nextYear.toISOString().split('T')[0];
    }
    updateMedicine(medicine.id, updates);
  };

  const handleFindPharmacy = (name: string) => {
    Linking.openURL(`https://www.google.com/search?q=buy+${encodeURIComponent(name)}+pharmacy+near+me`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase List</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Medicines that need restocking soon.</Text>

        {purchaseList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No medicines need restocking right now.</Text>
          </View>
        ) : (
          purchaseList.map((medicine) => {
            const member = getMember(medicine.assignedToId);
            const isExpired = daysUntil(medicine.expiryDate) < 0;

            return (
              <View key={medicine.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: '#f1f5f9' }]}>
                     <Text style={styles.avatarText}>{medicine.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.medName}>{medicine.name}</Text>
                      {isExpired && <Text style={styles.expiredBadge}>Expired</Text>}
                    </View>
                    
                    <Text style={styles.memberText}>{member?.name} • {medicine.quantity} {medicine.unit} left</Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity 
                    style={styles.restockBtn}
                    onPress={() => handleRestock(medicine)}
                  >
                    <ShoppingCart size={16} color="#ffffff" />
                    <Text style={styles.restockText}>Mark Restocked</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.findBtn}
                    onPress={() => handleFindPharmacy(medicine.name)}
                  >
                    <Search size={16} color="#0f766e" />
                    <Text style={styles.findText}>Find Pharmacy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
  emptyState: { backgroundColor: '#ffffff', padding: 32, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { color: '#64748b', textAlign: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#64748b' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  expiredBadge: { backgroundColor: '#fee2e2', color: '#ef4444', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  memberText: { fontSize: 14, color: '#64748b', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  restockBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0f766e', paddingVertical: 12, borderRadius: 8 },
  restockText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  findBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#ccfbf1', paddingVertical: 12, borderRadius: 8 },
  findText: { color: '#0f766e', fontWeight: 'bold', fontSize: 14 },
});
