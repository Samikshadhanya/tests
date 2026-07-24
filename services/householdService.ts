import { collection, doc, addDoc, getDocs, updateDoc, getDoc, setDoc, query, where, documentId } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Household, UserProfile, FamilyMember } from '@/lib/types';

export async function fetchUserProfile() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  let profile: UserProfile = { 
    uid, 
    email: auth.currentUser?.email || '', 
    name: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User', 
    role: 'Host', 
    authProvider: 'email', 
    householdIds: [], 
    calendarConnected: false 
  };
  
  if (userDoc.exists()) {
    profile = { ...profile, ...userDoc.data() };
  } else {
    // create default profile if it doesn't exist
    await setDoc(userRef, profile, { merge: true }).catch(console.error);
    
    // Automatically create a default household for new users
    const docRef = await addDoc(collection(db, 'households'), { 
      name: 'My Family', 
      ownerUid: uid, 
      members: [{ uid, role: 'owner' }], 
      createdAt: new Date().toISOString() 
    });
    
    profile.householdIds = [docRef.id];
    profile.activeHouseholdId = docRef.id;
    await setDoc(userRef, { householdIds: [docRef.id], activeHouseholdId: docRef.id }, { merge: true });
    
    // Automatically create a default family member so they can add medicines immediately
    await addDoc(collection(db, 'members'), {
      name: profile.name,
      role: 'Host',
      age: 'Unspecified',
      gender: 'Unspecified',
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=0f766e&color=fff`,
      healthNotes: [],
      knownAllergies: 'None known',
      householdId: docRef.id,
      uid: profile.uid
    });
  }

  let households: Household[] = [];
  if (profile.householdIds && profile.householdIds.length > 0) {
    // Firestore 'in' query has a limit of 10, but should be fine for households
    const q = query(collection(db, 'households'), where(documentId(), 'in', profile.householdIds));
    const hSnap = await getDocs(q);
    households = hSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Household));
  }

  const household = households.find(h => h.id === profile.activeHouseholdId) || households[0] || null;

  let familyMembers: FamilyMember[] = [];
  if (household) {
    const mQ = query(collection(db, 'members'), where('householdId', '==', household.id));
    const mSnap = await getDocs(mQ);
    familyMembers = mSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as FamilyMember));
  }

  return { profile, household, households, familyMembers };
}

export async function createHousehold(name: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  
  const docRef = await addDoc(collection(db, 'households'), { 
    name, 
    ownerUid: uid, 
    members: [{ uid, role: 'owner' }], 
    createdAt: new Date().toISOString() 
  });
  
  const newHousehold = { id: docRef.id, name, ownerUid: uid, members: [{ uid, role: 'owner' }] } as Household;
  
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const data = userDoc.data();
    await updateDoc(userRef, { 
      householdIds: [...(data.householdIds || []), docRef.id], 
      activeHouseholdId: docRef.id 
    });
  }

  return { household: newHousehold };
}

export async function getHousehold(id: string) {
  const docRef = await getDoc(doc(db, 'households', id));
  return { household: { id: docRef.id, ...(docRef.data() as any) } as Household };
}

export async function setActiveHousehold(activeHouseholdId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  
  await updateDoc(doc(db, 'users', uid), { activeHouseholdId });
  return { ok: true as const };
}

export async function generateInviteCode(householdId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  // Verify ownership
  const householdRef = doc(db, 'households', householdId);
  const householdDoc = await getDoc(householdRef);
  if (!householdDoc.exists() || householdDoc.data().ownerUid !== uid) {
    throw new Error('Not authorized to generate invite code');
  }

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Store the invite code in a separate collection that any signed-in user can read
  await setDoc(doc(db, 'householdInvites', inviteCode), {
    householdId,
    createdBy: uid,
    createdAt: new Date().toISOString()
  });

  await updateDoc(householdRef, { inviteCode });
  return { inviteCode };
}

export async function joinHousehold(inviteCode: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const inviteRef = doc(db, 'householdInvites', inviteCode.toUpperCase());
  const inviteDoc = await getDoc(inviteRef);

  if (!inviteDoc.exists()) {
    throw new Error('Invalid or expired invite code');
  }

  const householdId = inviteDoc.data()?.householdId;
  if (!householdId) {
    throw new Error('Invalid invite code data');
  }

  // Update user's profile to include this household
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    const data = userDoc.data();
    const householdIds = data.householdIds || [];
    if (!householdIds.includes(householdId)) {
      await updateDoc(userRef, { 
        householdIds: [...householdIds, householdId],
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

  // Add the user as a family profile in the new household so they show up in dropdowns
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

  return { householdId };
}
