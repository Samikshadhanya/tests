import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Appointment, AppointmentInput } from '@/lib/types';

export async function fetchAppointments(householdId: string) {
  const q = query(collection(db, 'appointments'), where('householdId', '==', householdId));
  const snapshot = await getDocs(q);
  const appointments = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Appointment));
  return { appointments };
}

export async function createAppointment(appointment: AppointmentInput & { householdId: string }) {
  const docRef = await addDoc(collection(db, 'appointments'), {
    ...appointment,
    status: appointment.status || 'Scheduled',
    createdAt: new Date().toISOString(),
  });
  return { appointment: { ...appointment, status: appointment.status || 'Scheduled', id: docRef.id } as Appointment };
}

export async function updateAppointment(id: string, appointment: Partial<AppointmentInput>) {
  const docRef = doc(db, 'appointments', id);
  await updateDoc(docRef, {
    ...appointment,
    updatedAt: new Date().toISOString(),
  });
  return { appointment: { ...appointment, id } as Appointment };
}

export async function deleteAppointment(id: string) {
  await deleteDoc(doc(db, 'appointments', id));
  return { ok: true as const };
}
