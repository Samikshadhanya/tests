'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { initialState, medicineImage, createDemoHouseholdState } from '@/lib/initial-data';
import type { AppState, AppUser, Caregiver, ExpiredMedicineReminder, FamilyMember, Household, Medicine, MedicineInput, MemberInput, ReminderInput, ReminderLog, Appointment, AppointmentInput } from '@/lib/types';
import { auth, db, googleProvider } from '@/lib/firebase';
import { daysUntil } from '@/lib/date-utils';
import { createHousehold, fetchUserProfile, setActiveHousehold, generateInviteCode as generateInviteCodeRequest, joinHousehold as joinHouseholdRequest } from '@/services/householdService';
import { createMedicine, deleteMedicine as deleteMedicineRequest, fetchMedicines, updateMedicine as updateMedicineRequest } from '@/services/medicineService';
import { createReminder, deleteReminder as deleteReminderRequest, fetchReminders, updateReminder as updateReminderRequest } from '@/services/reminderService';
import { createCaregiver, deleteCaregiver as deleteCaregiverRequest, fetchCaregivers } from '@/services/caregiverService';
import { createAppointment, deleteAppointment as deleteAppointmentRequest, fetchAppointments, updateAppointment as updateAppointmentRequest } from '@/services/appointmentService';
import { fetchEmergencyContact, saveEmergencyContact, subscribeEmergencyContact } from '@/services/emergencyContactService';

export type { AppState, AppUser, Caregiver, ExpiredMedicineReminder, FamilyMember, Medicine, MedicineInput, MemberInput, ReminderInput, ReminderLog, Appointment, AppointmentInput };

type AppStore = AppState & {
  loading: boolean;
  error: string | null;
  signIn: (provider: AppUser['authProvider'], email?: string, name?: string, age?: string, role?: string, password?: string, createAccount?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshHouseholdData: () => Promise<void>;
  addMedicine: (medicine: MedicineInput) => Promise<void>;
  updateMedicine: (id: string, medicine: Partial<MedicineInput>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  addMember: (member: MemberInput) => Promise<void>;
  updateMember: (id: string, member: Partial<MemberInput>) => Promise<void>;
  addReminder: (reminder: ReminderInput) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markDose: (id: string, status: ReminderLog['status']) => Promise<void>;
  addCaregiver: (caregiver: Omit<Caregiver, 'id' | 'status'>) => Promise<void>;
  removeCaregiver: (id: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status' | 'householdId'> & { status?: Appointment['status'] }) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getMember: (id: string) => FamilyMember | undefined;
  switchHousehold: (household: string) => Promise<void>;
  addHousehold: (household: string) => Promise<void>;
  generateInviteCode: () => Promise<string>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  lowStockMedicines: Medicine[];
  expiringMedicines: Medicine[];
  duplicateMedicines: Medicine[];
  purchaseList: Medicine[];
  todayReminders: ReminderLog[];
  toggleElderMode: (enabled: boolean) => Promise<void>;
  toggleCaregiverOptIn: (memberId: string) => Promise<void>;
  updateEmergencyContact: (contact: { name: string; phone: string } | null) => Promise<void>;
  removeExpiredReminder: (id: string) => void;
};

const AppContext = createContext<AppStore | null>(null);

const localProviders = new Set<AppUser['authProvider']>(['guest']);

const newLocalId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const userFromProfile = (
  profile: Awaited<ReturnType<typeof fetchUserProfile>>['profile'],
  household: Household | null,
  households: Household[] = [],
  familyMembers: FamilyMember[] = [],
): AppUser => {
  const myMember = familyMembers.find(m => m.uid === profile.uid);
  const isElderly = myMember?.accessLevel === 'Elderly';

  let emergencyContact = profile.emergencyContact || (household as any)?.emergencyContact || (myMember as any)?.emergencyContact;
  if (typeof window !== 'undefined') {
    if (emergencyContact) {
      localStorage.setItem('emergencyContact', JSON.stringify(emergencyContact));
    } else {
      const saved = localStorage.getItem('emergencyContact');
      if (saved) {
        try { emergencyContact = JSON.parse(saved); } catch (e) {}
      }
    }
  }

  return {
    uid: profile.uid,
    name: profile.name || profile.email.split('@')[0] || 'User',
    email: profile.email,
    photoURL: profile.photoURL,
    role: profile.role || 'Host',
    authProvider: profile.authProvider || 'google',
    household: household?.name || 'My Family',
    householdId: household?.id || profile.activeHouseholdId || profile.householdIds[0],
    households: households.length ? households.map((item) => item.name) : household ? [household.name] : [],
    householdIds: households.length ? households.map((item) => item.id) : profile.householdIds,
    calendarConnected: profile.calendarConnected,
    elderMode: isElderly ? true : profile.elderMode,
    caregiverForIds: profile.caregiverForIds,
    accessLevel: myMember?.accessLevel || 'Leader', // Default creator/host to leader
    emergencyContact: emergencyContact,
  };
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const storeRef = React.useRef<AppStore | null>(null);

  const loadHouseholdData = useCallback(async (householdId?: string) => {
    if (!householdId || !auth.currentUser) return;

    const [medicineResult, reminderResult, caregiverResult, appointmentResult, emergencyContact] = await Promise.all([
      fetchMedicines(householdId),
      fetchReminders({ householdId }),
      fetchCaregivers(householdId),
      fetchAppointments(householdId),
      fetchEmergencyContact(householdId),
    ]);

    setState((current) => ({
      ...current,
      medicines: medicineResult.medicines,
      reminderLogs: reminderResult.reminders,
      caregivers: caregiverResult.caregivers,
      appointments: appointmentResult.appointments,
      user: {
        ...current.user,
        emergencyContact: emergencyContact ?? current.user.emergencyContact,
      },
    }));
  }, []);

  const loadAuthenticatedUser = useCallback(async (expectedUid = auth.currentUser?.uid) => {
    if (!expectedUid) return;

    try {
      const bundle = await fetchUserProfile();

      if (auth.currentUser?.uid !== expectedUid) return;

      const appUser = userFromProfile(bundle.profile, bundle.household, bundle.households, bundle.familyMembers);

      setState((current) => ({
        ...current,
        user: appUser,
        members: bundle.familyMembers,
      }));

      await loadHouseholdData(appUser.householdId);
    } catch (err) {
      console.warn('Failed to load profile from Firestore, creating fallback state:', err);
      if (auth.currentUser && auth.currentUser.uid === expectedUid) {
        const fallbackUser: AppUser = {
          uid: auth.currentUser.uid,
          name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
          email: auth.currentUser.email || '',
          photoURL: auth.currentUser.photoURL || undefined,
          role: 'Host',
          authProvider: 'google',
          household: 'My Family',
          householdId: 'default-household',
          calendarConnected: false,
          accessLevel: 'Leader',
        };
        setState((current) => ({
          ...current,
          user: fallbackUser,
        }));
      }
    }
  }, [loadHouseholdData]);

  useEffect(() => {
    function handleSignedOut() {
      setState(initialState);
      setLoading(false);
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    // Handle redirect result from Google sign-in (fires on page load after redirect)
    getRedirectResult(auth).catch((err) => {
      if (err?.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your Vercel domain';
        setError(`Domain not authorized: Please add "${currentDomain}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
      } else if (err?.code && err.code !== 'auth/popup-closed-by-user') {
        console.error('Redirect sign-in error:', err);
        setError(`Firebase: Error (${err.code}).`);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null);

      if (!firebaseUser) {
        handleSignedOut();
        return;
      }

      try {
        setLoading(true);
        
        // Add a 10 second timeout in case Firestore hangs (e.g. database not created)
        const timeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout loading user data. Please check your Firebase Firestore setup or network connection.')), 10000);
        });
        
        await Promise.race([loadAuthenticatedUser(), timeout]);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load your MedHome data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadAuthenticatedUser]);

  useEffect(() => {
    import('@/lib/notifications').then(({ requestNotificationPermissions }) => {
      requestNotificationPermissions();
    });
  }, []);

  // Real-time listener for emergency contact from the dedicated Firestore collection
  useEffect(() => {
    const householdId = state.user.householdId;
    if (!householdId || localProviders.has(state.user.authProvider) || !auth.currentUser) return;

    const unsubscribe = subscribeEmergencyContact(householdId, (contact) => {
      setState((current) => ({
        ...current,
        user: { ...current.user, emergencyContact: contact ?? undefined },
      }));
    });

    return () => unsubscribe();
  }, [state.user.householdId, state.user.authProvider]);

  useEffect(() => {
    if (loading || !state.user.uid || !state.members.length) return;
    const uid = state.user.uid;
    import('@/lib/notifications').then(({ syncLocalNotifications }) => {
      syncLocalNotifications(uid, state.members, state.reminderLogs, state.medicines, state.user.caregiverForIds || [], state.appointments);
    });
  }, [loading, state.user.uid, state.members, state.reminderLogs, state.medicines, state.user.caregiverForIds, state.appointments]);

  const refreshHouseholdData = useCallback(async () => {
    if (!state.user.householdId || localProviders.has(state.user.authProvider)) return;
    setError(null);

    try {
      await loadHouseholdData(state.user.householdId);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh household data.');
    }
  }, [loadHouseholdData, state.user.authProvider, state.user.householdId]);

  const value = useMemo<AppStore>(() => {
    const LOW_STOCK_MIN = 5;
    const lowStockMedicines = state.medicines.filter((medicine) => medicine.quantity <= Math.max(medicine.lowStockAt, LOW_STOCK_MIN));
    const expiringMedicines = state.medicines.filter((medicine) => {
      const days = daysUntil(medicine.expiryDate);
      return days >= 0 && days <= 30;
    });
    const duplicateMedicines = state.medicines.filter((medicine, index, all) =>
      all.findIndex((item) => item.name.toLowerCase() === medicine.name.toLowerCase()) !== index,
    );

    // Dynamically derive the logged-in user's access level from the members list.
    // This ensures role changes made by a Leader take effect immediately without
    // needing a separate state sync in updateMember.
    const hasUidLinkedMember = state.members.some(m => m.uid === state.user.uid);
    const myMember = state.members.find(m =>
      m.uid === state.user.uid ||
      (!hasUidLinkedMember && m.name.toLowerCase() === state.user.name.toLowerCase())
    );
    const effectiveAccessLevel = myMember?.accessLevel || state.user.accessLevel || 'Leader';
    const effectiveElderMode = effectiveAccessLevel === 'Elderly' ? true : state.user.elderMode;
    const effectiveUser = {
      ...state.user,
      accessLevel: effectiveAccessLevel as 'Leader' | 'Standard' | 'Elderly',
      elderMode: effectiveElderMode,
    };

    const householdId = state.user.householdId;
    const isLocalSession = !auth.currentUser || localProviders.has(state.user.authProvider);

    return {
      ...state,
      user: effectiveUser,
      loading,
      error,
      lowStockMedicines,
      expiringMedicines,
      duplicateMedicines,
      purchaseList: lowStockMedicines,
      todayReminders: state.reminderLogs,
      refreshHouseholdData,
      signIn: async (provider, email, name, age, role, password, createAccount) => {
        setError(null);

        if (provider === 'google') {
          const { Capacitor } = await import('@capacitor/core');
          if (Capacitor.isNativePlatform()) {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            const result = await FirebaseAuthentication.signInWithGoogle();
            if (result?.credential?.idToken) {
              const credential = GoogleAuthProvider.credential(result.credential.idToken);
              await signInWithCredential(auth, credential);
            } else {
              throw new Error('Google native sign-in failed: No ID token returned.');
            }
          } else {
            try {
              await signInWithPopup(auth, googleProvider);
            } catch (popupErr: any) {
              if (popupErr?.code === 'auth/popup-blocked') {
                await signInWithRedirect(auth, googleProvider);
                return;
              }
              if (popupErr?.code === 'auth/unauthorized-domain') {
                const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your Vercel domain';
                throw new Error(`Domain not authorized: Please add "${currentDomain}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
              }
              throw popupErr;
            }
          }
          await loadAuthenticatedUser(auth.currentUser?.uid);
          return;
        }

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
          await loadAuthenticatedUser(auth.currentUser?.uid);
          return;
        }

        const fallbackName = provider === 'guest' ? name || 'Guest User' : email?.split('@')[0] || 'Demo User';
        
        if (provider === 'guest') {
          setState(createDemoHouseholdState({
            uid: newLocalId('local-user'),
            name: fallbackName,
            email: email || 'guest@example.com',
            age: age,
            role: role || 'Host'
          }));
        } else {
          setState({
            ...initialState,
            user: {
              uid: newLocalId('local-user'),
              name: fallbackName,
              email: email || '',
              role: role || 'Host',
              authProvider: provider,
              household: 'Local Household',
              householdId: newLocalId('local-household'),
              households: ['Local Household'],
              householdIds: [],
              calendarConnected: false,
            },
            members: [],
          });
        }
      },
      signOut: async () => {
        setError(null);
        setLoading(true);
        setState(initialState);

        try {
          if (auth.currentUser) {
            await firebaseSignOut(auth);
          }
        } finally {
          setLoading(false);
        }
      },

      switchHousehold: async (newHousehold) => {
        const index = state.user.households?.findIndex((name) => name === newHousehold) ?? -1;
        const nextHouseholdId = index >= 0 ? state.user.householdIds?.[index] : undefined;
        setState((current) => ({
          ...current,
          user: { ...current.user, household: newHousehold, householdId: nextHouseholdId || current.user.householdId },
          medicines: [],
          reminderLogs: [],
          caregivers: [],
          appointments: [],
        }));
        if (nextHouseholdId && !isLocalSession) {
          await setActiveHousehold(nextHouseholdId);
          await loadHouseholdData(nextHouseholdId);
        }
      },
      addHousehold: async (newHousehold) => {
        if (isLocalSession) {
          setState((current) => ({
            ...current,
            user: {
              ...current.user,
              household: newHousehold,
              householdId: newLocalId('local-household'),
              households: [...(current.user.households || []), newHousehold],
            },
          }));
          return;
        }

        const result = await createHousehold(newHousehold);
        const bundle = await fetchUserProfile();
        const appUser = userFromProfile(bundle.profile, result.household, bundle.households, bundle.familyMembers);
        setState((current) => ({
          ...current,
          user: appUser,
          members: bundle.familyMembers,
          medicines: [],
          reminderLogs: [],
          appointments: [],
        }));
      },
      generateInviteCode: async () => {
        if (!householdId) throw new Error('No active household selected.');
        const result = await generateInviteCodeRequest(householdId);
        return result.inviteCode;
      },
      joinHousehold: async (inviteCode: string) => {
        const result = await joinHouseholdRequest(inviteCode);
        const bundle = await fetchUserProfile();
        const appUser = userFromProfile(bundle.profile, bundle.household, bundle.households, bundle.familyMembers);
        setState((current) => ({
          ...current,
          user: appUser,
          members: bundle.familyMembers,
          medicines: [],
          reminderLogs: [],
          appointments: [],
        }));
        await loadHouseholdData(result.householdId);
      },
      addMedicine: async (medicine) => {
        const reminderTimes = medicine.reminderTimes.filter(Boolean);

        if (isLocalSession) {
          const id = newLocalId('med');
          const newMedicine: Medicine = { ...medicine, reminderTimes, id, image: medicine.image || medicineImage, householdId };
          const newReminders: ReminderLog[] = reminderTimes.map((time) => ({
            id: newLocalId('reminder'),
            householdId,
            medicineId: id,
            memberId: medicine.assignedToId,
            time,
            status: 'upcoming',
          }));
          setState((current) => ({
            ...current,
            medicines: [...current.medicines, newMedicine],
            reminderLogs: [...current.reminderLogs, ...newReminders],
          }));
          return;
        }

        if (!householdId) throw new Error('No active household selected.');
        const result = await createMedicine({ ...medicine, householdId, assignedToMemberId: medicine.assignedToId, reminderTimes });
        setState((current) => ({ ...current, medicines: [...current.medicines, result.medicine] }));
        await loadHouseholdData(householdId);
      },
      updateMedicine: async (id, medicine) => {
        if (isLocalSession) {
          setState((current) => ({ ...current, medicines: current.medicines.map((item) => item.id === id ? { ...item, ...medicine } : item) }));
          return;
        }

        const result = await updateMedicineRequest(id, medicine);
        setState((current) => ({ ...current, medicines: current.medicines.map((item) => item.id === id ? { ...item, ...result.medicine } : item) }));
      },
      deleteMedicine: async (id) => {
        if (isLocalSession) {
          setState((current) => ({
            ...current,
            medicines: current.medicines.filter((item) => item.id !== id),
            reminderLogs: current.reminderLogs.filter((item) => item.medicineId !== id),
          }));
          return;
        }

        await deleteMedicineRequest(id);
        setState((current) => ({
          ...current,
          medicines: current.medicines.filter((item) => item.id !== id),
          reminderLogs: current.reminderLogs.filter((item) => item.medicineId !== id),
        }));
      },
      addMember: async (member) => {
        const nextMember = {
          ...member,
          householdId,
          image: member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0f766e&color=fff`,
        };

        if (isLocalSession) {
          setState((current) => ({ ...current, members: [...current.members, { ...nextMember, id: newLocalId('member') }] }));
          return;
        }

        const docRef = await addDoc(collection(db, 'members'), nextMember);
        setState((current) => ({ ...current, members: [...current.members, { ...nextMember, id: docRef.id }] }));
      },
      updateMember: async (id, member) => {
        // Helper: check if updated member belongs to the logged-in user
        // Matches by uid first; falls back to name if no profile has uid linked yet
        const isMyProfile = (current: AppState, updatedItem: FamilyMember) => {
          if (updatedItem.uid === current.user.uid) return true;
          const hasLinkedProfile = current.members.some(m => m.uid === current.user.uid);
          if (!hasLinkedProfile && updatedItem.name.toLowerCase() === current.user.name.toLowerCase()) return true;
          return false;
        };

        if (isLocalSession) {
          setState((current) => {
            const newMembers = current.members.map((item) => item.id === id ? { ...item, ...member } : item);
            let newUser = current.user;
            const updatedItem = newMembers.find(m => m.id === id);
            if (updatedItem && isMyProfile(current, updatedItem)) {
              const newElderMode = updatedItem.accessLevel === 'Elderly' ? true : (updatedItem.accessLevel === 'Standard' || updatedItem.accessLevel === 'Leader' ? false : current.user.elderMode);
              newUser = { ...current.user, accessLevel: updatedItem.accessLevel || 'Leader', elderMode: newElderMode };
            }
            return { ...current, members: newMembers, user: newUser };
          });
          return;
        }

        await updateDoc(doc(db, 'members', id), member);
        setState((current) => {
          const isMyProfile = (updatedItem: FamilyMember) => {
            if (updatedItem.uid === current.user.uid) return true;
            const hasLinkedProfile = current.members.some(m => m.uid === current.user.uid);
            if (!hasLinkedProfile && updatedItem.name.toLowerCase() === current.user.name.toLowerCase()) return true;
            return false;
          };
          const newMembers = current.members.map((item) => item.id === id ? { ...item, ...member } : item);
          let newUser = current.user;
          const updatedItem = newMembers.find(m => m.id === id);
          if (updatedItem && isMyProfile(updatedItem)) {
            const newElderMode = updatedItem.accessLevel === 'Elderly' ? true : (updatedItem.accessLevel === 'Standard' || updatedItem.accessLevel === 'Leader' ? false : current.user.elderMode);
            newUser = { ...current.user, accessLevel: updatedItem.accessLevel || 'Leader', elderMode: newElderMode };
          }
          return { ...current, members: newMembers, user: newUser };
        });
      },
      addReminder: async (reminder) => {
        if (isLocalSession) {
          setState((current) => ({
            ...current,
            reminderLogs: [...current.reminderLogs, { ...reminder, id: newLocalId('reminder'), householdId, status: reminder.status || 'upcoming' }],
          }));
          return;
        }

        if (!householdId) throw new Error('No active household selected.');
        const result = await createReminder({ ...reminder, householdId, userId: state.user.uid });
        setState((current) => ({ ...current, reminderLogs: [...current.reminderLogs, result.reminder] }));
      },
      deleteReminder: async (id) => {
        if (isLocalSession) {
          setState((current) => ({ ...current, reminderLogs: current.reminderLogs.filter((item) => item.id !== id) }));
          return;
        }

        await deleteReminderRequest(id);
        setState((current) => ({ ...current, reminderLogs: current.reminderLogs.filter((item) => item.id !== id) }));
      },
      markDose: async (id, status) => {
        const takenAt = status === 'taken' ? new Date().toISOString() : undefined;
        const reminder = state.reminderLogs.find((item) => item.id === id);
        const previousStatus = reminder?.status;
        const medicineId = reminder?.medicineId;

        if (isLocalSession) {
          setState((current) => ({
            ...current,
            medicines: current.medicines.map((medicine) => {
              if (medicine.id !== medicineId) return medicine;
              if (status === 'taken' && previousStatus !== 'taken') {
                return { ...medicine, quantity: Math.max(0, medicine.quantity - 1) };
              }
              if (previousStatus === 'taken' && status !== 'taken') {
                return { ...medicine, quantity: medicine.quantity + 1 };
              }
              return medicine;
            }),
            reminderLogs: current.reminderLogs.map((item) => item.id === id ? { ...item, status, takenAt } : item),
          }));
          return;
        }

        const result = await updateReminderRequest(id, { status, takenAt, medicineId }, previousStatus);
        setState((current) => ({
          ...current,
          medicines: result.medicine
            ? current.medicines.map((item) => item.id === result.medicine?.id ? result.medicine : item)
            : current.medicines,
          reminderLogs: current.reminderLogs.map((item) => item.id === id ? result.reminder : item),
        }));
      },
      addCaregiver: async (caregiver) => {
        if (isLocalSession) {
          setState((current) => ({ ...current, caregivers: [...current.caregivers, { ...caregiver, id: newLocalId('caregiver'), householdId, status: 'Invited' }] }));
          return;
        }

        if (!householdId) throw new Error('No active household selected.');
        const result = await createCaregiver({ ...caregiver, householdId, status: 'Invited' });
        setState((current) => ({ ...current, caregivers: [...current.caregivers, result.caregiver] }));
      },
      removeCaregiver: async (id) => {
        if (isLocalSession) {
          setState((current) => ({ ...current, caregivers: current.caregivers.filter((item) => item.id !== id) }));
          return;
        }

        await deleteCaregiverRequest(id);
        setState((current) => ({ ...current, caregivers: current.caregivers.filter((item) => item.id !== id) }));
      },
      addAppointment: async (appointment) => {
        if (isLocalSession) {
          setState((current) => ({ ...current, appointments: [...current.appointments, { ...appointment, id: newLocalId('appointment'), householdId, status: appointment.status || 'Scheduled' } as Appointment] }));
          return;
        }

        if (!householdId) throw new Error('No active household selected.');
        const result = await createAppointment({ ...appointment, householdId } as any);
        setState((current) => ({ ...current, appointments: [...current.appointments, result.appointment] }));
      },
      updateAppointment: async (id, appointment) => {
        if (isLocalSession) {
          setState((current) => ({ ...current, appointments: current.appointments.map((item) => item.id === id ? { ...item, ...appointment } : item) }));
          return;
        }

        const result = await updateAppointmentRequest(id, appointment);
        setState((current) => ({ ...current, appointments: current.appointments.map((item) => item.id === id ? { ...item, ...result.appointment } : item) }));
      },
      deleteAppointment: async (id) => {
        if (isLocalSession) {
          setState((current) => ({ ...current, appointments: current.appointments.filter((item) => item.id !== id) }));
          return;
        }

        await deleteAppointmentRequest(id);
        setState((current) => ({ ...current, appointments: current.appointments.filter((item) => item.id !== id) }));
      },
      getMember: (id) => state.members.find((member) => member.id === id),
      toggleElderMode: async (enabled: boolean) => {
        const hasUidLinkedMember = state.members.some(m => m.uid === state.user.uid);
        const myMember = state.members.find(m =>
          m.uid === state.user.uid ||
          (!hasUidLinkedMember && m.name.toLowerCase() === state.user.name.toLowerCase())
        );
        
        let nextAccessLevel: any = undefined;
        if (!enabled && myMember?.accessLevel === 'Elderly') {
          nextAccessLevel = state.user.role === 'Host' ? 'Leader' : 'Standard';
        }

        if (isLocalSession) {
          setState((current) => {
            const nextMembers = nextAccessLevel && myMember
              ? current.members.map(m => m.id === myMember.id ? { ...m, accessLevel: nextAccessLevel } : m)
              : current.members;
            return { ...current, members: nextMembers, user: { ...current.user, elderMode: enabled } };
          });
          return;
        }

        const promises = [updateDoc(doc(db, 'users', state.user.uid!), { elderMode: enabled })];
        if (nextAccessLevel && myMember) {
          promises.push(updateDoc(doc(db, 'members', myMember.id), { accessLevel: nextAccessLevel }));
        }
        await Promise.all(promises);

        setState((current) => {
          const nextMembers = nextAccessLevel && myMember
            ? current.members.map(m => m.id === myMember.id ? { ...m, accessLevel: nextAccessLevel } : m)
            : current.members;
          return { ...current, members: nextMembers, user: { ...current.user, elderMode: enabled } };
        });
      },
      toggleCaregiverOptIn: async (memberId: string) => {
        const currentIds = state.user.caregiverForIds || [];
        const enabled = !currentIds.includes(memberId);
        const newIds = enabled ? [...currentIds, memberId] : currentIds.filter(id => id !== memberId);
        
        if (isLocalSession) {
          setState((current) => ({ ...current, user: { ...current.user, caregiverForIds: newIds } }));
          return;
        }
        await updateDoc(doc(db, 'users', state.user.uid!), { caregiverForIds: newIds });
        setState((current) => ({ ...current, user: { ...current.user, caregiverForIds: newIds } }));
      },
      updateEmergencyContact: async (contact: { name: string; phone: string } | null) => {
        const hid = state.user.householdId;

        // For authenticated users with a real household: write to dedicated collection.
        // The onSnapshot listener will pick up the change and update state automatically.
        if (hid && !isLocalSession) {
          try {
            await saveEmergencyContact(hid, contact);
          } catch (e) {
            console.error('Failed to save emergencyContact:', e);
          }
          return; // state update handled by onSnapshot
        }

        // Local/guest fallback: update state directly
        setState((current) => ({
          ...current,
          user: { ...current.user, emergencyContact: contact || undefined },
        }));
      },
      removeExpiredReminder: (id: string) => {
        setState((current) => ({
          ...current,
          expiredReminders: current.expiredReminders.filter((rem) => rem.id !== id),
        }));
      },
    };
  }, [error, loadAuthenticatedUser, loadHouseholdData, loading, refreshHouseholdData, state]);

  storeRef.current = value;

  useEffect(() => {
    const setupListener = async () => {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
        if (notificationAction.actionId === 'take') {
          const reminderIds = notificationAction.notification.extra?.reminderIds;
          if (reminderIds && Array.isArray(reminderIds) && storeRef.current) {
            reminderIds.forEach((id: string) => storeRef.current?.markDose(id, 'taken'));
          } else {
            const reminderId = notificationAction.notification.extra?.reminderId;
            if (reminderId && storeRef.current) {
              storeRef.current.markDose(reminderId, 'taken');
            }
          }
        }
      });
    };
    setupListener();

    return () => {
      import('@capacitor/core').then(({ Capacitor }) => {
        if (Capacitor.isNativePlatform()) {
          import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
            LocalNotifications.removeAllListeners();
          });
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!state.user.householdId || localProviders.has(state.user.authProvider)) return;

    let cancelled = false;

    async function loadSecondaryCollections() {
      try {
        const [membersSnapshot, caregiversSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'members'), where('householdId', '==', state.user.householdId))),
          getDocs(query(collection(db, 'caregivers'), where('householdId', '==', state.user.householdId))),
        ]);

        if (cancelled) return;

        setState((current) => ({
          ...current,
          members: membersSnapshot.docs.map((item) => ({ id: item.id, ...item.data() } as FamilyMember)),
          caregivers: caregiversSnapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Caregiver)),
        }));
      } catch (secondaryError) {
        setError(secondaryError instanceof Error ? secondaryError.message : 'Failed to load household members.');
      }
    }

    loadSecondaryCollections();

    return () => {
      cancelled = true;
    };
  }, [state.user.authProvider, state.user.householdId]);

  useEffect(() => {
    if (loading) return;

    const expiredMedicines = state.medicines.filter((m) => daysUntil(m.expiryDate) < 0);
    if (expiredMedicines.length === 0) return;

    const newReminders: ExpiredMedicineReminder[] = [];
    expiredMedicines.forEach((m) => {
      const alreadyExists = state.expiredReminders.some(
        (r) => r.medicineId === m.id || (r.medicineName === m.name && r.expiryDate === m.expiryDate)
      );
      if (!alreadyExists) {
        newReminders.push({
          id: `expired-${m.id}-${Date.now()}`,
          medicineId: m.id,
          medicineName: m.name,
          expiryDate: m.expiryDate,
          assignedToId: m.assignedToId,
          removedAt: new Date().toISOString(),
        });
      }
    });

    if (newReminders.length > 0) {
      setState((current) => ({
        ...current,
        expiredReminders: [...current.expiredReminders, ...newReminders],
      }));
    }

    if (storeRef.current) {
      expiredMedicines.forEach((m) => {
        storeRef.current!.deleteMedicine(m.id).catch(console.error);
      });
    }
  }, [state.medicines, state.expiredReminders, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center text-sm font-medium text-slate-600">
        Loading MedHome...
      </div>
    );
  }

  return (
    <AppContext.Provider value={value}>
      {error && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used inside AppProvider');
  return context;
}
