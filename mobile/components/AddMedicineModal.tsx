import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppStore } from '../lib/app-store';
import type { MedicineInput } from '../lib/types';

interface AddMedicineModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddMedicineModal({ visible, onClose }: AddMedicineModalProps) {
  const { members, addMedicine } = useAppStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Prescription');
  const [strength, setStrength] = useState('');
  const [type, setType] = useState('Tablet');
  const [quantity, setQuantity] = useState('30');
  const [unit, setUnit] = useState('tablets');
  const [expiryDate, setExpiryDate] = useState('');
  const [use, setUse] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [mealInstruction, setMealInstruction] = useState('After food');
  const [reminderTimes, setReminderTimes] = useState('08:00, 20:00');
  const [assignedToId, setAssignedToId] = useState(members[0]?.id || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const medInput: MedicineInput = {
        name: name.trim(),
        category,
        strength,
        type,
        quantity: Number(quantity) || 10,
        unit,
        assignedToId: assignedToId || members[0]?.id || 'm1',
        expiryDate: expiryDate.trim(),
        use: use.trim(),
        dosage,
        mealInstruction,
        reminderTimes: reminderTimes.split(',').map((t) => t.trim()).filter(Boolean),
        lowStockAt: 5,
      };
      await addMedicine(medInput);
      onClose();
      // Reset form
      setName('');
      setStrength('');
      setExpiryDate('');
      setUse('');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Medicine</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
            <Text style={styles.label}>Medicine Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Paracetamol" placeholderTextColor="#94a3b8" />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Strength</Text>
                <TextInput style={styles.input} value={strength} onChangeText={setStrength} placeholder="e.g. 500mg" placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Type</Text>
                <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="Tablet / Inhaler" placeholderTextColor="#94a3b8" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="30" placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Unit</Text>
                <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="tablets" placeholderTextColor="#94a3b8" />
              </View>
            </View>

            <Text style={styles.label}>Simple Use (Optional)</Text>
            <TextInput style={styles.input} value={use} onChangeText={setUse} placeholder="e.g. Blood pressure, fever" placeholderTextColor="#94a3b8" />

            <Text style={styles.label}>Expiry Date (Optional - YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={expiryDate} onChangeText={setExpiryDate} placeholder="e.g. 2026-12-31 (or leave blank)" placeholderTextColor="#94a3b8" />

            <Text style={styles.label}>Dosage</Text>
            <TextInput style={styles.input} value={dosage} onChangeText={setDosage} placeholder="1 tablet" placeholderTextColor="#94a3b8" />

            <Text style={styles.label}>Meal Instruction</Text>
            <TextInput style={styles.input} value={mealInstruction} onChangeText={setMealInstruction} placeholder="After food" placeholderTextColor="#94a3b8" />

            <Text style={styles.label}>Reminder Times (comma separated)</Text>
            <TextInput style={styles.input} value={reminderTimes} onChangeText={setReminderTimes} placeholder="08:00, 20:00" placeholderTextColor="#94a3b8" />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={!name.trim() || saving} style={[styles.saveBtn, !name.trim() ? styles.saveBtnDisabled : null]}>
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Medicine'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    paddingHorizontal: 20,
  },
  formContent: {
    paddingVertical: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
