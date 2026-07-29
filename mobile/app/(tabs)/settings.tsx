import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { useAppStore } from '../../lib/app-store';
import { ShieldCheck, Users, Trash2, LogOut } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, toggleElderMode, deleteHousehold, signOut } = useAppStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteHousehold = (hid: string) => {
    Alert.alert(
      'Delete Household',
      'Are you sure you want to delete this household? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(hid);
            try {
              await deleteHousehold(hid);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete household');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Settings" subtitle="Account, household management & mode toggle" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Info Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <ShieldCheck size={20} color="#0f766e" />
            <Text style={styles.cardTitle}>Account Details</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.val}>{user.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.val}>{user.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Active Household:</Text>
            <Text style={styles.val}>{user.household}</Text>
          </View>
        </View>

        {/* Mode Toggle Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Interface Mode</Text>
          <Text style={styles.cardSub}>Switch between standard mode and large-font Elderly mode.</Text>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, !user.elderMode ? styles.modeActive : null]}
              onPress={() => toggleElderMode(false)}
            >
              <Text style={[styles.modeText, !user.elderMode ? styles.modeTextActive : null]}>Standard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, user.elderMode ? styles.modeActive : null]}
              onPress={() => toggleElderMode(true)}
            >
              <Text style={[styles.modeText, user.elderMode ? styles.modeTextActive : null]}>Elderly Mode</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Household Management & Delete Household */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Users size={20} color="#0f766e" />
            <Text style={styles.cardTitle}>Household Management</Text>
          </View>
          <Text style={styles.cardSub}>Only the owner can delete a household. This action cannot be undone.</Text>

          {user.householdIds?.map((hid, index) => {
            const name = user.households?.[index] || hid;
            return (
              <View key={hid} style={styles.hhRow}>
                <Text style={styles.hhName}>{name}</Text>
                <TouchableOpacity
                  style={styles.deleteHhBtn}
                  onPress={() => handleDeleteHousehold(hid)}
                  disabled={deletingId === hid}
                >
                  <Trash2 size={14} color="#ef4444" />
                  <Text style={styles.deleteHhText}>{deletingId === hid ? 'Deleting...' : 'Delete'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  label: {
    fontSize: 13,
    color: '#64748b',
  },
  val: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeActive: {
    backgroundColor: '#0f766e',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  modeTextActive: {
    color: '#ffffff',
  },
  hhRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  hhName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  deleteHhBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  deleteHhText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});
