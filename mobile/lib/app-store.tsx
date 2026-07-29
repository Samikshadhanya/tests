import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { AppState, AppUser, Medicine, FamilyMember, ReminderLog, Caregiver, Appointment, MedicineInput } from '../../lib/types';
import { daysUntil } from '../../lib/date-utils';
import { saveEmergencyContact, subscribeEmergencyContact } from '../../services/emergencyContactService';

type MobileAppStore = AppState & {
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  addMedicine: (medicine: MedicineInput) => Promise<void>;
  updateMedicineQuantity: (id: string, newQuantity: number) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  markDose: (id: string, status: ReminderLog['status']) => Promise<void>;
  updateEmergencyContact: (contact: { name: string; phone: string } | null) => Promise<void>;
  toggleElderMode: (enabled: boolean) => Promise<void>;
  deleteHousehold: (householdId: string) => Promise<void>;
  lowStockMedicines: Medicine[];
  expiringMedicines: Medicine[];
};

const AppContext = createContext<MobileAppStore | null>(null);

const defaultUser: AppUser = {
  uid: 'demo-user',
  name: 'Rajesh Mehta',
  email: 'rajesh@example.com',
  role: 'Host',
  authProvider: 'guest',
  household: 'The Mehta Household',
  householdId: 'mehta-household-01',
  households: ['The Mehta Household'],
  householdIds: ['mehta-household-01'],
  calendarConnected: false,
  accessLevel: 'Leader',
  elderMode: false,
  emergencyContact: { name: 'Rohan Mehta', phone: '+91 98765 43210' },
};

const initialDemoMembers: FamilyMember[] = [
  { id: 'm1', name: 'Ramesh Mehta', role: 'Grandfather', age: '82', gender: 'Male', image: 'https://ui-avatars.com/api/?name=Ramesh+Mehta&background=0f766e&color=fff', healthNotes: ['Severe arthritis', 'Hypertension'], knownAllergies: 'Penicillin', accessLevel: 'Elderly' },
  { id: 'm2', name: 'Rajesh Mehta', role: 'Father', age: '58', gender: 'Male', image: 'https://ui-avatars.com/api/?name=Rajesh+Mehta&background=0f766e&color=fff', healthNotes: ['Type 2 Diabetes'], knownAllergies: 'Sulfa drugs', accessLevel: 'Leader' },
  { id: 'm3', name: 'Sunita Mehta', role: 'Mother', age: '54', gender: 'Female', image: 'https://ui-avatars.com/api/?name=Sunita+Mehta&background=0f766e&color=fff', healthNotes: ['Hypothyroidism'], knownAllergies: 'None known', accessLevel: 'Leader' },
  { id: 'm4', name: 'Priya Mehta', role: 'Daughter', age: '28', gender: 'Female', image: 'https://ui-avatars.com/api/?name=Priya+Mehta&background=0f766e&color=fff', healthNotes: ['Allergic asthma'], knownAllergies: 'Aspirin / NSAIDs', accessLevel: 'Standard' },
  { id: 'm5', name: 'Aryan Mehta', role: 'Son', age: '24', gender: 'Male', image: 'https://ui-avatars.com/api/?name=Aryan+Mehta&background=0f766e&color=fff', healthNotes: ['General fitness'], knownAllergies: 'None known', accessLevel: 'Standard' },
];

const initialDemoMedicines: Medicine[] = [
  { id: 'med-1', householdId: 'mehta-household-01', assignedToId: 'm1', name: 'Donepezil', category: 'Prescription', strength: '5mg', type: 'Tablet', quantity: 30, unit: 'tablets', expiryDate: '', use: 'Memory support', dosage: '1 tablet', mealInstruction: 'Before bed', reminderTimes: ['21:00'], lowStockAt: 5, image: '' },
  { id: 'med-2', householdId: 'mehta-household-01', assignedToId: 'm1', name: 'Amlodipine', category: 'Prescription', strength: '10mg', type: 'Tablet', quantity: 30, unit: 'tablets', expiryDate: '2026-08-30', use: 'Blood pressure', dosage: '1 tablet', mealInstruction: 'Morning', reminderTimes: ['08:00'], lowStockAt: 5, image: '' },
  { id: 'med-3', householdId: 'mehta-household-01', assignedToId: 'm2', name: 'Metformin', category: 'Prescription', strength: '500mg', type: 'Tablet', quantity: 45, unit: 'tablets', expiryDate: '2026-06-20', use: 'Blood sugar control', dosage: '1 tablet', mealInstruction: 'Twice daily after food', reminderTimes: ['08:00', '20:00'], lowStockAt: 10, image: '' },
  { id: 'med-4', householdId: 'mehta-household-01', assignedToId: 'm3', name: 'Thyronorm', category: 'Prescription', strength: '50mcg', type: 'Tablet', quantity: 30, unit: 'tablets', expiryDate: '2026-10-15', use: 'Thyroid support', dosage: '1 tablet', mealInstruction: 'Empty stomach', reminderTimes: ['06:30'], lowStockAt: 7, image: '' },
  { id: 'med-5', householdId: 'mehta-household-01', assignedToId: 'm4', name: 'Budecort', category: 'Prescription', strength: '200mcg', type: 'Inhaler', quantity: 1, unit: 'inhaler', expiryDate: '2026-12-01', use: 'Asthma prevention', dosage: '2 puffs', mealInstruction: 'Morning & Night', reminderTimes: ['07:30', '19:30'], lowStockAt: 1, image: '' },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: defaultUser,
    members: initialDemoMembers,
    medicines: initialDemoMedicines,
    reminderLogs: [],
    caregivers: [],
    appointments: [],
    expiredReminders: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth observer
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setState((current) => ({
          ...current,
          user: {
            ...current.user,
            uid: user.uid,
            email: user.email || current.user.email,
            name: user.displayName || current.user.name,
            authProvider: 'google',
          },
        }));
      }
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync for Emergency Contacts
  useEffect(() => {
    const householdId = state.user.householdId;
    if (!householdId || !auth?.currentUser) return;

    const unsub = subscribeEmergencyContact(householdId, (contact) => {
      if (contact) {
        setState((current) => ({
          ...current,
          user: { ...current.user, emergencyContact: contact },
        }));
      }
    });

    return () => unsub();
  }, [state.user.householdId]);

  // Real-time Firestore sync for Medicines
  useEffect(() => {
    const householdId = state.user.householdId;
    if (!householdId || !auth?.currentUser) return;

    const q = query(collection(db, 'medicines'), where('householdId', '==', householdId));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Medicine));
      if (docs.length > 0) {
        setState((current) => ({ ...current, medicines: docs }));
      }
    });

    return () => unsub();
  }, [state.user.householdId]);

  const value = useMemo<MobileAppStore>(() => {
    const lowStockMedicines = state.medicines.filter((m) => m.quantity <= m.lowStockAt);
    const expiringMedicines = state.medicines.filter((m) => {
      const days = daysUntil(m.expiryDate);
      return isFinite(days) && days >= 0 && days <= 30;
    });

    return {
      ...state,
      loading,
      error,
      lowStockMedicines,
      expiringMedicines,
      signOut: async () => {
        if (auth?.currentUser) await firebaseSignOut(auth);
        setState((current) => ({ ...current, user: defaultUser }));
      },
      addMedicine: async (medInput) => {
        const newMed: Medicine = {
          ...medInput,
          id: `med-${Date.now()}`,
          householdId: state.user.householdId,
          image: medInput.image || '',
        };
        setState((current) => ({ ...current, medicines: [...current.medicines, newMed] }));
      },
      updateMedicineQuantity: async (id, newQuantity) => {
        setState((current) => ({
          ...current,
          medicines: current.medicines.map((m) => (m.id === id ? { ...m, quantity: newQuantity } : m)),
        }));
      },
      deleteMedicine: async (id) => {
        setState((current) => ({
          ...current,
          medicines: current.medicines.filter((m) => m.id !== id),
        }));
      },
      markDose: async (id, status) => {
        setState((current) => ({
          ...current,
          reminderLogs: current.reminderLogs.map((r) => (r.id === id ? { ...r, status, takenAt: new Date().toISOString() } : r)),
        }));
      },
      updateEmergencyContact: async (contact) => {
        const householdId = state.user.householdId;
        if (householdId && auth?.currentUser) {
          await saveEmergencyContact(householdId, contact);
        }
        setState((current) => ({
          ...current,
          user: { ...current.user, emergencyContact: contact || undefined },
        }));
      },
      toggleElderMode: async (enabled) => {
        setState((current) => ({
          ...current,
          user: { ...current.user, elderMode: enabled },
        }));
      },
      deleteHousehold: async (householdId) => {
        setState((current) => ({
          ...current,
          user: {
            ...current.user,
            householdIds: (current.user.householdIds || []).filter((h) => h !== householdId),
          },
        }));
      },
    };
  }, [state, loading, error]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
}
