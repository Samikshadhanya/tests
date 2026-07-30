import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../lib/app-store';
import { Calendar, Clock, MapPin, Plus, Trash2, Activity, ChevronLeft } from 'lucide-react-native';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { appointments, members, addAppointment, deleteAppointment, getMember, user } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  const [showMemberSelect, setShowMemberSelect] = useState(false);

  const handleAddAppointment = async () => {
    if (!memberId || !doctorName || !date || !time) return;

    await addAppointment({
      householdId: user.householdId || '',
      memberId,
      doctorName,
      specialty,
      date,
      time,
      location,
      notes,
    });

    setIsAdding(false);
    setDoctorName('');
    setSpecialty('');
    setDate('');
    setTime('');
    setLocation('');
    setNotes('');
  };

  const sortedAppointments = [...appointments].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.subtitle}>Manage doctor visits and consultations.</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {sortedAppointments.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No upcoming appointments. Schedule one today.</Text>
          </View>
        )}

        {sortedAppointments.map((apt) => {
          const member = getMember(apt.memberId);
          return (
            <View key={apt.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Activity size={24} color="#0f766e" />
                </View>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.docName}>Dr. {apt.doctorName}</Text>
                  <Text style={styles.specialty}>{apt.specialty}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteAppointment(apt.id)} style={styles.deleteBtn}>
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>

              <Text style={styles.patientName}>Patient: {member?.name}</Text>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Calendar size={14} color="#64748b" />
                  <Text style={styles.detailText}>{apt.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.detailText}>{apt.time}</Text>
                </View>
              </View>

              {apt.location ? (
                <View style={[styles.detailItem, { marginTop: 8 }]}>
                  <MapPin size={14} color="#64748b" />
                  <Text style={styles.detailText}>{apt.location}</Text>
                </View>
              ) : null}

              {apt.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>"{apt.notes}"</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Add Appointment Modal */}
      <Modal visible={isAdding} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Appointment</Text>
            <TouchableOpacity onPress={() => setIsAdding(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            <Text style={styles.label}>Patient (Family Member)</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowMemberSelect(!showMemberSelect)}>
              <Text style={styles.inputText}>
                {members.find(m => m.id === memberId)?.name || 'Select Member'}
              </Text>
            </TouchableOpacity>
            
            {showMemberSelect && (
              <View style={styles.memberSelectList}>
                {members.map(m => (
                  <TouchableOpacity 
                    key={m.id} 
                    style={styles.memberSelectItem}
                    onPress={() => { setMemberId(m.id); setShowMemberSelect(false); }}
                  >
                    <Text style={styles.memberSelectText}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Doctor Name</Text>
                <TextInput style={styles.input} value={doctorName} onChangeText={setDoctorName} placeholder="e.g. Smith" placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Specialty</Text>
                <TextInput style={styles.input} value={specialty} onChangeText={setSpecialty} placeholder="e.g. Cardiologist" placeholderTextColor="#94a3b8" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2024-10-15" placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Time</Text>
                <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="10:30 AM" placeholderTextColor="#94a3b8" />
              </View>
            </View>

            <Text style={styles.label}>Location / Clinic</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. City Hospital" placeholderTextColor="#94a3b8" />

            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Bring test reports..." placeholderTextColor="#94a3b8" multiline />

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddAppointment}>
              <Text style={styles.submitBtnText}>Schedule Appointment</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  subtitle: { fontSize: 14, color: '#64748b', flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f766e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  addBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  emptyState: { backgroundColor: '#ffffff', padding: 32, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { color: '#64748b', textAlign: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconBox: { width: 48, height: 48, backgroundColor: '#ccfbf1', borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardTitleBox: { flex: 1 },
  docName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  specialty: { fontSize: 14, color: '#64748b', marginTop: 2 },
  deleteBtn: { padding: 4 },
  patientName: { fontSize: 14, fontWeight: '600', color: '#334155', marginTop: 12, marginBottom: 8 },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#64748b' },
  notesBox: { marginTop: 12, backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8 },
  notesText: { fontSize: 13, color: '#64748b', fontStyle: 'italic' },
  
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  cancelText: { color: '#64748b', fontSize: 16 },
  formContent: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: '#0f172a', backgroundColor: '#ffffff' },
  inputText: { fontSize: 15, color: '#0f172a' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  memberSelectList: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, marginTop: 4 },
  memberSelectItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  memberSelectText: { fontSize: 15, color: '#0f172a' },
  submitBtn: { backgroundColor: '#0f766e', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
