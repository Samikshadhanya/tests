import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, getDocs } from 'firebase/firestore';
import type { AppState, AppUser, Medicine, FamilyMember, ReminderLog, Caregiver, Appointment, MedicineInput, MemberInput } from './types';
import { daysUntil, getLocalTodayString } from './date-utils';
import { saveEmergencyContact, subscribeEmergencyContact } from '../services/emergencyContactService';

type MobileAppStore = AppState & {
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  addMedicine: (medicine: MedicineInput) => Promise<void>;
  updateMedicine: (id: string, updates: Partial<Medicine>) => Promise<void>;
  updateMedicineQuantity: (id: string, newQuantity: number) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  markDose: (id: string, status: ReminderLog['status'], medicineId?: string, dosage?: string) => Promise<void>;
  updateEmergencyContact: (contact: { name: string; phone: string } | null) => Promise<void>;
  toggleElderMode: (enabled: boolean) => Promise<void>;
  generateInviteCode: () => Promise<string>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  deleteHousehold: (householdId: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'> & { status?: Appointment['status'] }) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getMember: (id: string) => FamilyMember | undefined;
  addMember: (member: MemberInput) => Promise<void>;
  signIn: (provider: AppUser['authProvider'] | 'demo', email?: string, name?: string, age?: string, role?: string, password?: string, createAccount?: boolean) => Promise<void>;
  demoLogin: () => void;
  lowStockMedicines: Medicine[];
  expiringMedicines: Medicine[];
  purchaseList: Medicine[];
  todayReminders: ReminderLog[];
  linkProfile: (memberId: string) => Promise<void>;
};

const AppContext = createContext<MobileAppStore | null>(null);

const defaultUnauthenticatedUser: AppUser = {
  uid: '',
  name: 'Guest User',
  email: '',
  role: 'Guest',
  authProvider: 'guest',
  household: '',
  householdId: '',
  households: [],
  householdIds: [],
  calendarConnected: false,
  accessLevel: 'Standard',
  elderMode: false,
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
    user: defaultUnauthenticatedUser,
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
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch real user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            let activeHouseholdId = data.activeHouseholdId || (data.householdIds && data.householdIds.length > 0 ? data.householdIds[0] : '');
            
            // Prevent Ghost Household
            if (activeHouseholdId) {
              const hhDoc = await getDoc(doc(db, 'households', activeHouseholdId));
              if (!hhDoc.exists()) {
                activeHouseholdId = '';
                const newIds = (data.householdIds || []).filter((id: string) => id !== data.activeHouseholdId);
                await updateDoc(doc(db, 'users', user.uid), {
                   activeHouseholdId: '',
                   householdIds: newIds
                });
                data.householdIds = newIds;
              }
            }
            
            setState((current) => ({
              ...current,
              user: {
                ...current.user,
                uid: user.uid,
                email: user.email || current.user.email,
                name: user.displayName || current.user.name,
                authProvider: 'google',
                householdId: activeHouseholdId,
                household: activeHouseholdId ? 'My Household' : '',
                households: activeHouseholdId ? ['My Household'] : [],
                householdIds: data.householdIds || [],
                elderMode: data.elderMode || false,
                calendarConnected: data.calendarConnected || false,
              },
            }));
          } else {
            // Fallback if user document doesn't exist yet
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
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setState((current) => ({
          ...current,
          user: defaultUnauthenticatedUser,
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

  // Real-time Firestore sync for Members
  useEffect(() => {
    const householdId = state.user.householdId;
    if (!householdId || !auth?.currentUser) return;

    const q = query(collection(db, 'members'), where('householdId', '==', householdId));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as FamilyMember));
      if (docs.length > 0) {
        setState((current) => ({ ...current, members: docs }));
      }
    });

    return () => unsub();
  }, [state.user.householdId]);

  // Real-time Firestore sync for Appointments
  useEffect(() => {
    const householdId = state.user.householdId;
    if (!householdId || !auth?.currentUser) return;

    const q = query(collection(db, 'appointments'), where('householdId', '==', householdId));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Appointment));
      if (docs.length > 0) {
        setState((current) => ({ ...current, appointments: docs }));
      }
    });

    return () => unsub();
  }, [state.user.householdId]);

  // Real-time Firestore sync for Reminder Logs
  useEffect(() => {
    const householdId = state.user.householdId;
    if (!householdId || !auth?.currentUser) return;

    const q = query(collection(db, 'reminders'), where('householdId', '==', householdId));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as ReminderLog));
      if (docs.length > 0) {
        setState((current) => ({ ...current, reminderLogs: docs }));
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
    
    // Purchase list is any medicine that is low stock or expired
    const purchaseList = [...state.medicines].filter(m => {
      const days = daysUntil(m.expiryDate);
      return m.quantity <= m.lowStockAt || (isFinite(days) && days < 0);
    });

    const todayStr = getLocalTodayString();
    const todayReminders = state.medicines.flatMap((med) => {
      return (med.reminderTimes || ['09:00']).map((t, idx) => {
        const doseId = `${med.id}-${todayStr}-${t}-${idx}`;
        const existingLog = state.reminderLogs.find((r) => r.id === doseId);
        return {
          id: doseId,
          medicineId: med.id,
          scheduleTime: t,
          time: t,
          status: existingLog ? existingLog.status : 'upcoming',
        };
      });
    }).sort((a, b) => a.time.localeCompare(b.time));

    return {
      ...state,
      loading,
      error,
      lowStockMedicines,
      expiringMedicines,
      purchaseList,
      todayReminders,
      signOut: async () => {
        try {
          if (auth?.currentUser) await firebaseSignOut(auth);
          setState((current) => ({
            ...current,
            user: defaultUnauthenticatedUser,
          }));
        } catch (err: any) {
          setError(err.message);
        }
      },
      demoLogin: () => {
        setState((current) => ({
          ...current,
          user: {
            ...current.user,
            uid: 'demo-user',
            authProvider: 'guest',
            name: 'Demo User',
            householdId: 'mehta-household-01',
            household: 'The Mehta Household',
            households: ['The Mehta Household'],
            householdIds: ['mehta-household-01'],
          },
        }));
      },
      signIn: async (provider, email, name, age, role, password, createAccount) => {
        setError(null);
        
        if (provider === 'email') {
          const cleanEmail = email?.trim();
          if (!cleanEmail || !password) {
            throw new Error('Email and password are required.');
          }
          if (createAccount) {
            await createUserWithEmailAndPassword(auth, cleanEmail, password);
          } else {
            await signInWithEmailAndPassword(auth, cleanEmail, password);
          }
          return;
        }

        const fallbackName = provider === 'guest' ? name || 'Guest User' : email?.split('@')[0] || 'Demo User';
        
        if (provider === 'guest') {
          // Fresh local state for the guest user
          setState((current) => ({
            ...current,
            user: {
              ...current.user,
              uid: `local-user-${Date.now()}`,
              name: fallbackName,
              email: email || 'guest@example.com',
              role: role || 'Host',
              authProvider: 'guest',
              household: 'Local Household',
              householdId: `local-household-${Date.now()}`,
              households: ['Local Household'],
              householdIds: [],
              calendarConnected: false,
            },
            members: [],
            medicines: [],
            reminderLogs: [],
            appointments: [],
            caregivers: [],
          }));
        } else if (provider === 'demo') {
           // Reuse the static demoLogin function logic
           setState((current) => ({
             ...current,
             user: {
               ...current.user,
               uid: 'demo-user',
               authProvider: 'guest',
               name: 'Demo User',
               householdId: 'mehta-household-01',
               household: 'The Mehta Household',
               households: ['The Mehta Household'],
               householdIds: ['mehta-household-01'],
             },
           }));
        }
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
      updateMedicine: async (id, updates) => {
        setState((current) => ({
          ...current,
          medicines: current.medicines.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
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
      getMember: (id) => state.members.find((m) => m.id === id),
      addMember: async (memberInput) => {
        const newMember: FamilyMember = {
          ...memberInput,
          id: `member-${Date.now()}`,
          householdId: state.user.householdId,
          image: memberInput.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberInput.name)}&background=0f766e&color=fff`,
        };
        setState((current) => ({ ...current, members: [...current.members, newMember] }));
      },
      addAppointment: async (appointment) => {
        const newApt: Appointment = {
          ...appointment,
          id: `apt-${Date.now()}`,
          householdId: state.user.householdId || '',
          status: appointment.status || 'Scheduled',
        };
        setState((current) => ({ ...current, appointments: [...current.appointments, newApt] }));
      },
      deleteAppointment: async (id) => {
        setState((current) => ({
          ...current,
          appointments: current.appointments.filter((a) => a.id !== id),
        }));
      },
      markDose: async (id, status, medicineId, dosage) => {
        setState((current) => {
          let updatedMedicines = current.medicines;
          
          // Deduct inventory if marked as taken
          if (status === 'taken' && medicineId && dosage) {
            const numToDeduct = parseInt(dosage.split(' ')[0]) || 1;
            updatedMedicines = current.medicines.map((m) => {
              if (m.id === medicineId && typeof m.quantity === 'number') {
                return { ...m, quantity: Math.max(0, m.quantity - numToDeduct) };
              }
              return m;
            });
          }

          const existingLogIndex = current.reminderLogs.findIndex((r) => r.id === id);
          if (existingLogIndex >= 0) {
            const newLogs = [...current.reminderLogs];
            newLogs[existingLogIndex] = { ...newLogs[existingLogIndex], status, takenAt: new Date().toISOString() };
            return { ...current, reminderLogs: newLogs, medicines: updatedMedicines };
          } else {
            return {
              ...current,
              medicines: updatedMedicines,
              reminderLogs: [
                ...current.reminderLogs,
                { id, status, takenAt: new Date().toISOString(), medicineId: medicineId || id.split('-')[0], scheduleTime: id.match(/\d{2}:\d{2}/)?.[0] || '09:00' },
              ] as any,
            };
          }
        });
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
      generateInviteCode: async () => {
        const uid = auth?.currentUser?.uid;
        const householdId = state.user.householdId;
        if (!uid || !householdId) throw new Error('Not authenticated or no active household');

        const householdRef = doc(db, 'households', householdId);
        const householdDoc = await getDoc(householdRef);
        if (!householdDoc.exists() || householdDoc.data().ownerUid !== uid) {
          throw new Error('Not authorized to generate invite code. Only the owner can do this.');
        }

        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, 'householdInvites', inviteCode), {
          householdId,
          createdBy: uid,
          createdAt: new Date().toISOString()
        });
        await updateDoc(householdRef, { inviteCode });
        return inviteCode;
      },
      joinHousehold: async (inviteCode) => {
        const uid = auth?.currentUser?.uid;
        if (!uid) throw new Error('Not authenticated');

        const inviteRef = doc(db, 'householdInvites', inviteCode.toUpperCase());
        const inviteDoc = await getDoc(inviteRef);

        if (!inviteDoc.exists()) {
          throw new Error('Invalid or expired invite code');
        }

        const householdId = inviteDoc.data()?.householdId;
        if (!householdId) throw new Error('Invalid invite code data');

        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        
        let newHouseholdIds = [householdId];
        if (userDoc.exists()) {
          const data = userDoc.data();
          const existingIds = data.householdIds || [];
          if (!existingIds.includes(householdId)) {
            newHouseholdIds = [...existingIds, householdId];
            await updateDoc(userRef, { 
              householdIds: newHouseholdIds,
              activeHouseholdId: householdId
            });
          }
        } else {
          await setDoc(userRef, {
            uid,
            householdIds: [householdId],
            activeHouseholdId: householdId,
            role: 'member'
          });
        }

        const mQ = query(collection(db, 'members'), where('householdId', '==', householdId), where('name', '==', auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User'));
        const mSnap = await getDocs(mQ);
        if (mSnap.empty) {
          await addDoc(collection(db, 'members'), {
            name: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User',
            role: 'Member',
            age: 'Unspecified',
            gender: 'Unspecified',
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser?.displayName || 'User')}&background=0f766e&color=fff`,
            healthNotes: [],
            knownAllergies: 'None known',
            householdId: householdId,
            uid: auth.currentUser?.uid
          });
        }

        setState((current) => ({
          ...current,
          user: {
            ...current.user,
            householdId: householdId,
            householdIds: newHouseholdIds,
          },
        }));
      },
      deleteHousehold: async (householdId) => {
        const uid = auth?.currentUser?.uid;
        if (!uid) throw new Error('Not authenticated');

        // Verify ownership
        const householdRef = doc(db, 'households', householdId);
        const householdDoc = await getDoc(householdRef);
        if (householdDoc.exists() && householdDoc.data().ownerUid !== uid) {
          throw new Error('Only the household owner can delete it');
        }

        if (householdDoc.exists()) {
          await deleteDoc(householdRef);
        }

        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        let newIds = state.user.householdIds || [];
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          newIds = (data.householdIds || []).filter((id: string) => id !== householdId);
          const newActiveId = data.activeHouseholdId === householdId
            ? (newIds[0] || null)
            : data.activeHouseholdId;
          await updateDoc(userRef, { householdIds: newIds, activeHouseholdId: newActiveId });
        }

        setState((current) => ({
          ...current,
          user: {
            ...current.user,
            householdIds: newIds,
            householdId: current.user.householdId === householdId ? newIds[0] || '' : current.user.householdId,
          },
        }));
      },
      linkProfile: async (memberId: string) => {
        const uid = auth?.currentUser?.uid;
        if (!uid) throw new Error('Not authenticated');
        
        const memberRef = doc(db, 'members', memberId);
        await updateDoc(memberRef, { uid });
        
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { linkedMemberId: memberId }, { merge: true });
        
        setState(curr => ({
          ...curr,
          user: { ...curr.user, linkedMemberId: memberId }
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
