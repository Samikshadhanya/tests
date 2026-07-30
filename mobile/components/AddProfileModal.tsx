import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppStore } from '../lib/app-store';

type AddProfileModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AddProfileModal({ visible, onClose }: AddProfileModalProps) {
  const { addMember } = useAppStore();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');
  const [accessLevel, setAccessLevel] = useState<'Standard' | 'Elderly' | 'Leader'>('Standard');

  const handleSave = () => {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    addMember({
      name,
      role: role || 'Family Member',
      age: age || '0',
      gender: gender || 'Not specified',
      knownAllergies: allergies,
      healthNotes: notes ? notes.split(',').map(n => n.trim()) : [],
      accessLevel
    });

    // Reset and close
    setName('');
    setRole('');
    setAge('');
    setGender('');
    setAllergies('');
    setNotes('');
    setAccessLevel('Standard');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Add Family Member</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Jane Doe" />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="e.g., 45" keyboardType="numeric" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Gender</Text>
                  <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholder="e.g., Female" />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Role / Relationship</Text>
                <TextInput style={styles.input} value={role} onChangeText={setRole} placeholder="e.g., Mother, Son" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Access Level</Text>
                <View style={styles.accessRow}>
                  {['Standard', 'Elderly', 'Leader'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.accessChip, accessLevel === level && styles.accessChipActive]}
                      onPress={() => setAccessLevel(level as any)}
                    >
                      <Text style={[styles.accessChipText, accessLevel === level && styles.accessChipTextActive]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Known Allergies</Text>
                <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} placeholder="e.g., Penicillin, Peanuts" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Health Notes (comma separated)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g., Hypertension, Diabetic"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Profile</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  form: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#f8fafc', color: '#0f172a' },
  textArea: { height: 80, textAlignVertical: 'top' },
  accessRow: { flexDirection: 'row', gap: 10 },
  accessChip: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  accessChipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  accessChipText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  accessChipTextActive: { color: '#ffffff' },
  saveBtn: { backgroundColor: '#0f766e', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
