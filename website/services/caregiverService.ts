import { collection, doc, addDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Caregiver } from '@/lib/types';

type CreateCaregiverPayload = Omit<Caregiver, 'id'> & {
  householdId: string;
};

export async function fetchCaregivers(householdId: string) {
  const q = query(collection(db, 'caregivers'), where('householdId', '==', householdId));
  const snapshot = await getDocs(q);
  const caregivers = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Caregiver));
  return { caregivers };
}

export async function createCaregiver(caregiver: CreateCaregiverPayload) {
  const docRef = await addDoc(collection(db, 'caregivers'), {
    ...caregiver,
    createdAt: new Date().toISOString(),
  });
  return { caregiver: { ...caregiver, id: docRef.id } as Caregiver };
}

export async function deleteCaregiver(id: string) {
  await deleteDoc(doc(db, 'caregivers', id));
  return { ok: true as const };
}
