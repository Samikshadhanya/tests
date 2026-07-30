import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface EmergencyContact {
  name: string;
  phone: string;
}

export async function fetchEmergencyContact(householdId: string): Promise<EmergencyContact | null> {
  const snap = await getDoc(doc(db, 'emergencyContacts', householdId));
  if (snap.exists()) {
    const data = snap.data();
    if (data?.name && data?.phone) {
      return { name: data.name, phone: data.phone };
    }
  }
  return null;
}

export async function saveEmergencyContact(householdId: string, contact: EmergencyContact | null): Promise<void> {
  const ref = doc(db, 'emergencyContacts', householdId);
  await setDoc(ref, {
    name: contact?.name ?? null,
    phone: contact?.phone ?? null,
    updatedAt: new Date().toISOString(),
  });
}

export function subscribeEmergencyContact(
  householdId: string,
  callback: (contact: EmergencyContact | null) => void
): () => void {
  return onSnapshot(doc(db, 'emergencyContacts', householdId), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (data?.name && data?.phone) {
        callback({ name: data.name, phone: data.phone });
        return;
      }
    }
    callback(null);
  });
}
