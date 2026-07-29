import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { useAppStore } from '../../lib/app-store';
import { ShieldAlert, Phone, MapPin, Edit2, Save, X } from 'lucide-react-native';

export default function EmergencyScreen() {
  const { user, updateEmergencyContact } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.emergencyContact?.name || '');
  const [phone, setPhone] = useState(user.emergencyContact?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    try {
      await updateEmergencyContact({ name: name.trim(), phone: phone.trim() });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDial = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Emergency SOS" subtitle="Quick access to emergency services" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Helpline Dial Card */}
        <View style={styles.sosCard}>
          <View style={styles.sosIconCircle}>
            <Phone size={36} color="#dc2626" />
          </View>
          <Text style={styles.sosTitle}>Emergency Call (112)</Text>
          <Text style={styles.sosSub}>Instantly dial local emergency helpline for immediate medical assistance.</Text>
          <TouchableOpacity style={styles.dialBtn} onPress={() => handleDial('112')}>
            <Phone size={20} color="#ffffff" />
            <Text style={styles.dialBtnText}>DIAL 112 NOW</Text>
          </TouchableOpacity>
        </View>

        {/* Hospital Finder Card */}
        <TouchableOpacity style={styles.hospitalCard} onPress={() => Linking.openURL('https://www.google.com/maps/search/hospitals+near+me')}>
          <View style={styles.hospitalIconCircle}>
            <MapPin size={28} color="#2563eb" />
          </View>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalTitle}>Find Nearby Hospitals</Text>
            <Text style={styles.hospitalSub}>Locate nearby hospitals and emergency centers via GPS map.</Text>
          </View>
        </TouchableOpacity>

        {/* Personal Contact Sync Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactTitle}>Personal Emergency Contact</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                <Edit2 size={16} color="#0f766e" />
              </TouchableOpacity>
            ) : null}
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Rohan Mehta" placeholderTextColor="#94a3b8" />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="e.g. +91 98765 43210" placeholderTextColor="#94a3b8" />

              <View style={styles.formFooter}>
                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                  <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save & Sync'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : user.emergencyContact ? (
            <View style={styles.contactDetails}>
              <View style={styles.contactRow}>
                <Text style={styles.contactName}>{user.emergencyContact.name}</Text>
                <Text style={styles.contactPhone}>{user.emergencyContact.phone}</Text>
              </View>
              <TouchableOpacity style={styles.callContactBtn} onPress={() => handleDial(user.emergencyContact!.phone)}>
                <Phone size={16} color="#ffffff" />
                <Text style={styles.callContactText}>Call Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.noContactText}>No emergency contact added yet. Tap edit to add one.</Text>
          )}
        </View>
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
  sosCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 16,
  },
  sosIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sosTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  sosSub: {
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  dialBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hospitalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  hospitalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  hospitalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  editBtn: {
    padding: 6,
    backgroundColor: '#ccfbf1',
    borderRadius: 6,
  },
  contactDetails: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  contactRow: {
    marginBottom: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
  },
  contactPhone: {
    fontSize: 14,
    color: '#15803d',
    marginTop: 2,
  },
  callContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0f766e',
    paddingVertical: 10,
    borderRadius: 6,
  },
  callContactText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noContactText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  editForm: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
