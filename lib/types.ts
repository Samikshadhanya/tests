export type FamilyMember = {
  id: string;
  householdId?: string;
  name: string;
  role: string;
  age: string;
  gender: string;
  image: string;
  healthNotes: string[];
  knownAllergies: string;
};

export type Medicine = {
  id: string;
  householdId?: string;
  name: string;
  category: string;
  strength: string;
  type: string;
  quantity: number;
  unit: string;
  assignedToId: string;
  expiryDate: string;
  manufactureDate?: string;
  pharmaName?: string;
  use: string;
  dosage: string;
  mealInstruction: string;
  reminderTimes: string[];
  lowStockAt: number;
  image: string;
};

export type ReminderLog = {
  id: string;
  householdId?: string;
  medicineId: string;
  memberId: string;
  userId?: string;
  time: string;
  status: 'taken' | 'missed' | 'upcoming';
  takenAt?: string;
};

export type ReminderInput = Omit<ReminderLog, 'id' | 'status'> & {
  status?: ReminderLog['status'];
};

export type Caregiver = {
  id: string;
  householdId?: string;
  name: string;
  relationship: string;
  accessLevel: string;
  phone?: string;
  email?: string;
  notes?: string;
  availability?: string;
  status: 'Active' | 'Invited';
};

export type Appointment = {
  id: string;
  householdId: string;
  memberId: string;
  doctorName: string;
  specialty: string;
  date: string; // ISO string
  time: string;
  location: string;
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
};

export type AppUser = {
  uid?: string;
  name: string;
  email: string;
  photoURL?: string;
  role: string;
  authProvider: 'email' | 'google' | 'microsoft' | 'facebook' | 'guest';
  household: string;
  householdId?: string;
  households?: string[];
  householdIds?: string[];
  calendarConnected: boolean;
};

export type AppState = {
  user: AppUser;
  members: FamilyMember[];
  medicines: Medicine[];
  reminderLogs: ReminderLog[];
  caregivers: Caregiver[];
  appointments: Appointment[];
};

export type MedicineInput = Omit<Medicine, 'id' | 'image'> & { image?: string };
export type MemberInput = Omit<FamilyMember, 'id' | 'image'> & { image?: string };
export type AppointmentInput = Omit<Appointment, 'id' | 'status'> & { status?: Appointment['status'] };

export type HouseholdRole = 'owner' | 'admin' | 'member' | 'caregiver';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: string;
  authProvider: AppUser['authProvider'];
  activeHouseholdId?: string;
  householdIds: string[];
  calendarConnected: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type HouseholdMember = {
  uid: string;
  role: HouseholdRole;
  joinedAt?: string;
};

export type Household = {
  id: string;
  name: string;
  ownerUid: string;
  inviteCode?: string;
  members: HouseholdMember[];
  memberProfileIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type MedicineDocument = Omit<Medicine, 'assignedToId'> & {
  householdId: string;
  assignedToUid?: string;
  assignedToMemberId?: string;
  createdByUid: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateMedicineInput = Omit<MedicineDocument, 'id' | 'createdByUid' | 'createdAt' | 'updatedAt' | 'image'> & {
  image?: string;
};

export type ReminderDocument = {
  id: string;
  householdId: string;
  medicineId: string;
  assignedToUid?: string;
  assignedToMemberId?: string;
  time: string;
  status: ReminderLog['status'];
  takenAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateHouseholdInput = {
  name: string;
};
