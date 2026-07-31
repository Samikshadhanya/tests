import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Medicine, ReminderInput, ReminderLog } from '@/lib/types';

type CreateReminderPayload = ReminderInput & {
  householdId: string;
  userId?: string;
};

export async function fetchReminders(params: { userId?: string; householdId?: string }) {
  let q = collection(db, 'reminders') as any;
  if (params.householdId) {
    q = query(collection(db, 'reminders'), where('householdId', '==', params.householdId));
  } else if (params.userId) {
    q = query(collection(db, 'reminders'), where('userId', '==', params.userId));
  }

  const snapshot = await getDocs(q);
  const reminders = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as ReminderLog));
  return { reminders };
}

export async function createReminder(reminder: CreateReminderPayload) {
  const docRef = await addDoc(collection(db, 'reminders'), {
    ...reminder,
    createdAt: new Date().toISOString(),
  });
  return { reminder: { ...reminder, id: docRef.id } as ReminderLog };
}

export async function updateReminder(id: string, reminder: Partial<ReminderLog>, previousStatus?: string) {
  const docRef = doc(db, 'reminders', id);
  await updateDoc(docRef, {
    ...reminder,
    updatedAt: new Date().toISOString(),
  });
  
  let medicine: Medicine | undefined = undefined;
  if (reminder.medicineId) {
    const medRef = doc(db, 'medicines', reminder.medicineId);
    const medSnap = await getDoc(medRef);
    if (medSnap.exists()) {
      const data = medSnap.data();
      let newQuantity = data.quantity;
      if (reminder.status === 'taken' && previousStatus !== 'taken') {
         newQuantity = Math.max(0, newQuantity - 1);
      } else if (previousStatus === 'taken' && reminder.status !== 'taken') {
         newQuantity = newQuantity + 1;
      }
      if (newQuantity !== data.quantity) {
         await updateDoc(medRef, { quantity: newQuantity });
         medicine = { id: medSnap.id, ...data, quantity: newQuantity } as Medicine;
      } else {
         medicine = { id: medSnap.id, ...data } as Medicine;
      }
    }
  }

  return { reminder: { ...reminder, id } as ReminderLog, medicine };
}

export async function deleteReminder(id: string) {
  await deleteDoc(doc(db, 'reminders', id));
  return { ok: true as const };
}
