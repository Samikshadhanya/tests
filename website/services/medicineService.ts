import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Medicine, MedicineInput } from '@/lib/types';

type CreateMedicinePayload = MedicineInput & {
  householdId: string;
  assignedToMemberId?: string;
};

export async function fetchMedicines(householdId: string) {
  const q = query(collection(db, 'medicines'), where('householdId', '==', householdId));
  const snapshot = await getDocs(q);
  const medicines = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Medicine));
  return { medicines };
}

export async function createMedicine(medicine: CreateMedicinePayload) {
  const docRef = await addDoc(collection(db, 'medicines'), {
    ...medicine,
    createdAt: new Date().toISOString(),
  });
  return { medicine: { ...medicine, id: docRef.id } as Medicine };
}

export async function updateMedicine(id: string, medicine: Partial<MedicineInput>) {
  const docRef = doc(db, 'medicines', id);
  await updateDoc(docRef, {
    ...medicine,
    updatedAt: new Date().toISOString(),
  });
  return { medicine: { ...medicine, id } as Medicine };
}

export async function deleteMedicine(id: string) {
  await deleteDoc(doc(db, 'medicines', id));
  return { ok: true as const };
}
