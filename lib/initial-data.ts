import type { AppState, Caregiver, ExpiredMedicineReminder, FamilyMember, Medicine, ReminderLog } from './types';

export const medicineImage =
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde0b?w=200&h=200&fit=crop';

export const initialState: AppState = {
  user: {
    name: '',
    email: '',
    role: 'Host',
    authProvider: 'email',
    household: '',
    households: [],
    calendarConnected: false,
  },
  members: [],
  medicines: [],
  reminderLogs: [],
  caregivers: [],
  appointments: [],
  expiredReminders: [],
};

const avatarFor = (name: string, background = '0f766e') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=fff`;

const isoDateFromToday = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const isoDateFromMonths = (offsetMonths: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  return date.toISOString().slice(0, 10);
};

export function createDemoHouseholdState(host: {
  uid: string;
  name: string;
  email: string;
  age?: string;
  role?: string;
}): AppState {
  const householdId = 'demo-household';
  const members: FamilyMember[] = [
    { id: 'member-001', householdId, name: host.name, role: host.role || 'Host', age: host.age || '35', gender: 'Unspecified', image: avatarFor(host.name), healthNotes: ['Primary account holder'], knownAllergies: 'None known' },
    { id: 'member-002', householdId, name: 'Asha Patel', role: 'Mother', age: '64', gender: 'Female', image: avatarFor('Asha Patel', '14b8a6'), healthNotes: ['Type 2 diabetes', 'Morning walks'], knownAllergies: 'Penicillin' },
    { id: 'member-003', householdId, name: 'Raj Patel', role: 'Father', age: '68', gender: 'Male', image: avatarFor('Raj Patel', '0369a1'), healthNotes: ['Hypertension'], knownAllergies: 'Sulfa' },
    { id: 'member-004', householdId, name: 'Maya Shah', role: 'Spouse', age: '34', gender: 'Female', image: avatarFor('Maya Shah', '7c3aed'), healthNotes: ['Migraine history'], knownAllergies: 'Ibuprofen' },
    { id: 'member-005', householdId, name: 'Neil Shah', role: 'Child', age: '9', gender: 'Male', image: avatarFor('Neil Shah', 'f59e0b'), healthNotes: ['Seasonal allergies'], knownAllergies: 'Peanuts' },
    { id: 'member-006', householdId, name: 'Isha Shah', role: 'Child', age: '6', gender: 'Female', image: avatarFor('Isha Shah', 'ec4899'), healthNotes: ['Asthma inhaler as needed'], knownAllergies: 'Dust' },
    { id: 'member-007', householdId, name: 'Kiran Mehta', role: 'Grandparent', age: '72', gender: 'Female', image: avatarFor('Kiran Mehta', '0891b2'), healthNotes: ['Arthritis'], knownAllergies: 'None known' },
    { id: 'member-008', householdId, name: 'Dev Mehta', role: 'Grandparent', age: '75', gender: 'Male', image: avatarFor('Dev Mehta', '4f46e5'), healthNotes: ['Cholesterol management'], knownAllergies: 'Aspirin' },
    { id: 'member-009', householdId, name: 'Sara Khan', role: 'Aunt', age: '42', gender: 'Female', image: avatarFor('Sara Khan', '0d9488'), healthNotes: ['Thyroid medication'], knownAllergies: 'None known' },
    { id: 'member-010', householdId, name: 'Omar Khan', role: 'Uncle', age: '45', gender: 'Male', image: avatarFor('Omar Khan', '2563eb'), healthNotes: ['Acidity episodes'], knownAllergies: 'None known' },
    { id: 'member-011', householdId, name: 'Tara Singh', role: 'Cousin', age: '19', gender: 'Female', image: avatarFor('Tara Singh', 'c026d3'), healthNotes: ['Iron supplement plan'], knownAllergies: 'Shellfish' },
    { id: 'member-012', householdId, name: 'Arjun Singh', role: 'Cousin', age: '22', gender: 'Male', image: avatarFor('Arjun Singh', '16a34a'), healthNotes: ['Sports injury recovery'], knownAllergies: 'None known' },
    { id: 'member-013', householdId, name: 'Leela Rao', role: 'Care recipient', age: '81', gender: 'Female', image: avatarFor('Leela Rao', 'dc2626'), healthNotes: ['Needs pill reminders'], knownAllergies: 'Codeine' },
    { id: 'member-014', householdId, name: 'Vikram Rao', role: 'Brother', age: '31', gender: 'Male', image: avatarFor('Vikram Rao', '9333ea'), healthNotes: ['Vitamin D deficiency'], knownAllergies: 'None known' },
    { id: 'member-015', householdId, name: 'Anika Rao', role: 'Sister', age: '28', gender: 'Female', image: avatarFor('Anika Rao', 'db2777'), healthNotes: ['Prenatal vitamins'], knownAllergies: 'Latex' },
  ];

  const medicines: Medicine[] = [
    { id: 'med-001', householdId, assignedToId: 'member-002', name: 'Metformin', category: 'Prescription', strength: '500mg', type: 'Tablet', quantity: 18, unit: 'tablets', expiryDate: isoDateFromToday(-20), manufactureDate: isoDateFromMonths(-18), pharmaName: 'Sun Pharma', use: 'Blood sugar control', dosage: '1 tablet', mealInstruction: 'After food', reminderTimes: ['08:00', '20:00'], lowStockAt: 10, image: medicineImage },
    { id: 'med-002', householdId, assignedToId: 'member-003', name: 'Amlodipine', category: 'Prescription', strength: '5mg', type: 'Tablet', quantity: 7, unit: 'tablets', expiryDate: isoDateFromToday(1), manufactureDate: isoDateFromMonths(-10), pharmaName: 'Cipla', use: 'Blood pressure', dosage: '1 tablet', mealInstruction: 'After breakfast', reminderTimes: ['09:00'], lowStockAt: 8, image: medicineImage },
    { id: 'med-003', householdId, assignedToId: 'member-004', name: 'Sumatriptan', category: 'Prescription', strength: '50mg', type: 'Tablet', quantity: 4, unit: 'tablets', expiryDate: isoDateFromMonths(12), manufactureDate: isoDateFromMonths(-3), pharmaName: 'Dr Reddy', use: 'Migraine relief', dosage: '1 tablet when needed', mealInstruction: 'With water', reminderTimes: ['21:00'], lowStockAt: 5, image: medicineImage },
    { id: 'med-004', householdId, assignedToId: 'member-005', name: 'Cetirizine', category: 'OTC', strength: '10mg', type: 'Tablet', quantity: 20, unit: 'tablets', expiryDate: isoDateFromMonths(12), manufactureDate: isoDateFromMonths(-2), pharmaName: 'Generic', use: 'Seasonal allergies', dosage: '1 tablet', mealInstruction: 'After dinner', reminderTimes: ['19:30'], lowStockAt: 6, image: medicineImage },
    { id: 'med-005', householdId, assignedToId: 'member-006', name: 'Salbutamol Inhaler', category: 'Prescription', strength: '100mcg', type: 'Inhaler', quantity: 1, unit: 'inhaler', expiryDate: isoDateFromToday(-5), manufactureDate: isoDateFromMonths(-14), pharmaName: 'GSK', use: 'Asthma relief', dosage: '2 puffs', mealInstruction: 'As needed', reminderTimes: ['07:30', '19:30'], lowStockAt: 1, image: medicineImage },
    { id: 'med-006', householdId, assignedToId: 'member-007', name: 'Calcium D3', category: 'Supplement', strength: '500mg', type: 'Tablet', quantity: 45, unit: 'tablets', expiryDate: isoDateFromMonths(12), manufactureDate: isoDateFromMonths(-1), pharmaName: 'HealthKart', use: 'Bone health', dosage: '1 tablet', mealInstruction: 'After lunch', reminderTimes: ['13:00'], lowStockAt: 12, image: medicineImage },
    { id: 'med-007', householdId, assignedToId: 'member-008', name: 'Atorvastatin', category: 'Prescription', strength: '10mg', type: 'Tablet', quantity: 11, unit: 'tablets', expiryDate: isoDateFromToday(1), manufactureDate: isoDateFromMonths(-8), pharmaName: 'Lupin', use: 'Cholesterol control', dosage: '1 tablet', mealInstruction: 'After dinner', reminderTimes: ['21:30'], lowStockAt: 10, image: medicineImage },
    { id: 'med-008', householdId, assignedToId: 'member-009', name: 'Levothyroxine', category: 'Prescription', strength: '50mcg', type: 'Tablet', quantity: 30, unit: 'tablets', expiryDate: isoDateFromMonths(12), manufactureDate: isoDateFromMonths(-5), pharmaName: 'Abbott', use: 'Thyroid support', dosage: '1 tablet', mealInstruction: 'Before food', reminderTimes: ['06:30'], lowStockAt: 10, image: medicineImage },
    { id: 'med-009', householdId, assignedToId: 'member-010', name: 'Pantoprazole', category: 'Prescription', strength: '40mg', type: 'Tablet', quantity: 3, unit: 'tablets', expiryDate: isoDateFromToday(-1), manufactureDate: isoDateFromMonths(-20), pharmaName: 'Torrent', use: 'Acidity relief', dosage: '1 tablet', mealInstruction: 'Before breakfast', reminderTimes: ['07:00'], lowStockAt: 5, image: medicineImage },
    { id: 'med-010', householdId, assignedToId: 'member-011', name: 'Ferrous Sulfate', category: 'Supplement', strength: '325mg', type: 'Tablet', quantity: 16, unit: 'tablets', expiryDate: isoDateFromToday(1), manufactureDate: isoDateFromMonths(-6), pharmaName: 'Generic', use: 'Iron deficiency', dosage: '1 tablet', mealInstruction: 'After food', reminderTimes: ['12:00'], lowStockAt: 10, image: medicineImage },
    { id: 'med-011', householdId, assignedToId: 'member-012', name: 'Naproxen', category: 'OTC', strength: '250mg', type: 'Tablet', quantity: 8, unit: 'tablets', expiryDate: isoDateFromMonths(12), manufactureDate: isoDateFromMonths(-2), pharmaName: 'Generic', use: 'Pain relief', dosage: '1 tablet', mealInstruction: 'After food', reminderTimes: ['10:00', '22:00'], lowStockAt: 6, image: medicineImage },
    { id: 'med-012', householdId, assignedToId: 'member-013', name: 'Donepezil', category: 'Prescription', strength: '5mg', type: 'Tablet', quantity: 22, unit: 'tablets', expiryDate: isoDateFromMonths(12), manufactureDate: isoDateFromMonths(-4), pharmaName: 'Eisai', use: 'Memory support', dosage: '1 tablet', mealInstruction: 'Before bed', reminderTimes: ['21:00'], lowStockAt: 8, image: medicineImage },
    { id: 'med-013', householdId, assignedToId: 'member-014', name: 'Vitamin D3', category: 'Supplement', strength: '1000 IU', type: 'Capsule', quantity: 60, unit: 'capsules', expiryDate: isoDateFromMonths(12), manufactureDate: isoDateFromMonths(-1), pharmaName: 'Nature Made', use: 'Vitamin D deficiency', dosage: '1 capsule', mealInstruction: 'After breakfast', reminderTimes: ['08:30'], lowStockAt: 15, image: medicineImage },
    { id: 'med-014', householdId, assignedToId: 'member-015', name: 'Prenatal Multivitamin', category: 'Supplement', strength: 'Daily', type: 'Tablet', quantity: 28, unit: 'tablets', expiryDate: isoDateFromToday(1), manufactureDate: isoDateFromMonths(-7), pharmaName: 'One A Day', use: 'Prenatal nutrition', dosage: '1 tablet', mealInstruction: 'After breakfast', reminderTimes: ['09:30'], lowStockAt: 12, image: medicineImage },
    { id: 'med-015', householdId, assignedToId: 'member-001', name: 'Paracetamol', category: 'OTC', strength: '650mg', type: 'Tablet', quantity: 2, unit: 'tablets', expiryDate: isoDateFromToday(-60), manufactureDate: isoDateFromMonths(-24), pharmaName: 'Generic', use: 'Fever and pain', dosage: '1 tablet', mealInstruction: 'After food', reminderTimes: ['11:00', '23:00'], lowStockAt: 6, image: medicineImage },
  ];

  const statuses: ReminderLog['status'][] = ['upcoming', 'taken', 'missed'];
  const reminderLogs: ReminderLog[] = medicines.flatMap((medicine, medicineIndex) =>
    medicine.reminderTimes.map((time, timeIndex) => ({
      id: `reminder-${medicine.id}-${timeIndex + 1}`,
      householdId,
      medicineId: medicine.id,
      memberId: medicine.assignedToId,
      time,
      status: statuses[(medicineIndex + timeIndex) % statuses.length],
      takenAt: statuses[(medicineIndex + timeIndex) % statuses.length] === 'taken' ? new Date().toISOString() : undefined,
    })),
  );

  const caregivers: Caregiver[] = [
    { id: 'caregiver-001', householdId, name: 'Priya Nair', relationship: 'Nurse', accessLevel: 'Full Access', phone: '+1 555-0101', email: 'priya@example.com', availability: 'Weekdays', notes: 'Morning check-ins', status: 'Active' },
    { id: 'caregiver-002', householdId, name: 'Rohan Das', relationship: 'Family friend', accessLevel: 'Reminder Access', phone: '+1 555-0102', email: 'rohan@example.com', availability: 'Evenings', notes: 'Backup reminder contact', status: 'Invited' },
  ];

  return {
    user: {
      uid: host.uid,
      name: host.name,
      email: host.email,
      role: host.role || 'Host',
      authProvider: 'guest',
      household: 'Demo Household',
      householdId,
      households: ['Demo Household'],
      householdIds: [householdId],
      calendarConnected: false,
    },
    members,
    medicines,
    reminderLogs,
    caregivers,
    appointments: [],
    expiredReminders: [],
  };
}
