'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  Heart,
  Pill,
  Plus,
  Shield,
  ShoppingCart,
  Stethoscope,
  UserPlus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/app-store';

export default function FamilyProfilePage() {
  const store = useAppStore();
  const { members, medicines, todayReminders, caregivers, addCaregiver, removeCaregiver } = store;
  
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? '');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isAddingMedicine, setIsAddingMedicine] = useState(false);
  const [isAddingCaretaker, setIsAddingCaretaker] = useState(false);
  const [medicineFormError, setMedicineFormError] = useState('');
  
  // New profile form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Family Member');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('Unspecified');
  const [newAllergies, setNewAllergies] = useState('');
  const [newHealthNotes, setNewHealthNotes] = useState('');
  
  const [caretakerName, setCaretakerName] = useState('');
  const [caretakerContact, setCaretakerContact] = useState('');
  const [caretakerEmail, setCaretakerEmail] = useState('');
  const [caretakerRelationship, setCaretakerRelationship] = useState('Son');
  const [caretakerAccessLevel, setCaretakerAccessLevel] = useState('Full Access');
  const [caretakerNotes, setCaretakerNotes] = useState('');
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    category: 'Prescription',
    strength: '',
    type: 'Tablet',
    quantity: 10,
    unit: 'tablets',
    expiryDate: '',
    manufactureDate: '',
    pharmaName: '',
    use: '',
    dosage: '1 tablet',
    mealInstruction: 'After food',
    reminderTimes: '08:00',
    lowStockAt: 5,
  });

  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? members[0];
  const profileMedicines = medicines.filter((medicine) => medicine.assignedToId === selectedMember?.id);
  const profileReminders = todayReminders.filter((reminder) => reminder.memberId === selectedMember?.id);

  useEffect(() => {
    if (!selectedMemberId && members[0]?.id) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  const warnings = useMemo(() => {
    const allergyText = selectedMember?.knownAllergies.toLowerCase() ?? '';
    return profileMedicines.filter((medicine) => allergyText !== 'none known' && allergyText !== '' && medicine.name.toLowerCase().includes(allergyText));
  }, [profileMedicines, selectedMember]);

  const minExpiryDate = getTomorrowDate();

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await store.addMember({
        name: newName.trim(),
        role: newRole,
        age: newAge || 'Unspecified',
        gender: newGender,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(newName.trim())}&background=random`,
        healthNotes: newHealthNotes.split(',').map(n => n.trim()).filter(Boolean),
        knownAllergies: newAllergies || 'None known',
      });

      setIsCreatingProfile(false);
      setNewName('');
      setNewRole('Family Member');
      setNewAge('');
      setNewGender('Unspecified');
      setNewAllergies('');
      setNewHealthNotes('');
    } catch (error) {
      console.error(error);
      alert('Failed to save profile. Please check your connection or permissions.');
    }
  };

  const handleAddMedicine = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMember?.id || !medicineForm.name.trim()) return;
    if (!isFutureDate(medicineForm.expiryDate)) {
      setMedicineFormError('Choose an expiry date after today.');
      return;
    }

    setMedicineFormError('');
    await store.addMedicine({
      ...medicineForm,
      name: medicineForm.name.trim(),
      assignedToId: selectedMember.id,
      reminderTimes: medicineForm.reminderTimes.split(',').map((time) => time.trim()).filter(Boolean),
    });

    setIsAddingMedicine(false);
    setMedicineForm({
      name: '',
      category: 'Prescription',
      strength: '',
      type: 'Tablet',
      quantity: 10,
      unit: 'tablets',
      expiryDate: '',
      manufactureDate: '',
      pharmaName: '',
      use: '',
      dosage: '1 tablet',
      mealInstruction: 'After food',
      reminderTimes: '08:00',
      lowStockAt: 5,
    });
  };

  return (
    <>
      <div className="page-panel space-y-5 p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">Family Profiles</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">Manage family members and view their health details.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-5 bg-teal-50">
                <div className="space-y-2">
                  <select
                    value={selectedMemberId}
                    onChange={(event) => setSelectedMemberId(event.target.value)}
                    className="min-h-11 w-full rounded-lg border border-teal-200 bg-white px-3 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    {members.map((member) => <option key={member.id} value={member.id}>{member.name} - {member.role}</option>)}
                  </select>
                  <Button 
                    onClick={() => setIsCreatingProfile(true)}
                    variant="outline"
                    className="w-full border-teal-200 text-teal-700 hover:bg-teal-100 bg-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Profile
                  </Button>
                  <Button
                    onClick={() => setIsAddingMedicine(true)}
                    disabled={!selectedMember}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pill for Selected Member
                  </Button>
                </div>
                {selectedMember && (
                  <div className="flex items-center gap-3 mt-5 p-3 bg-white rounded-lg border border-teal-100 shadow-sm">
                    <img src={selectedMember.image} alt={selectedMember.name} className="w-14 h-14 rounded-full object-cover border-2 border-teal-100" />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-slate-900">{selectedMember.name}</h2>
                      <p className="text-sm text-slate-600">{selectedMember.role}{selectedMember.age !== 'Unspecified' ? `, age ${selectedMember.age}` : ''}</p>
                      <p className="text-xs text-slate-500">{selectedMember.gender === 'Unspecified' ? 'Details not added yet' : selectedMember.gender}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedMember?.name}'s Health Summary</h2>
                  <p className="text-slate-600 mt-2"><span className="font-medium text-slate-900">Health notes:</span> {selectedMember?.healthNotes.length ? selectedMember.healthNotes.join(', ') : 'None'}</p>
                  <p className="text-slate-600"><span className="font-medium text-slate-900">Known allergies:</span> {selectedMember?.knownAllergies || 'None known'}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-left sm:text-right">
                  <p className="text-2xl md:text-3xl font-bold text-teal-700">{profileMedicines.length}</p>
                  <p className="text-sm font-medium text-slate-500">active medicines</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="My Medicines" icon={<Pill className="w-5 h-5 text-teal-600" />}>
                <div className="space-y-3">
                  {profileMedicines.length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-500 italic">No active medicines.</p>
                      <Button
                        onClick={() => setIsAddingMedicine(true)}
                        disabled={!selectedMember}
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {selectedMember ? 'Add pill' : 'Create profile first'}
                      </Button>
                    </div>
                  ) : null}
                  {profileMedicines.map((medicine) => (
                    <div key={medicine.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <p className="font-medium text-slate-900">{medicine.name}</p>
                      <p className="text-sm text-slate-600">{medicine.dosage} - {medicine.mealInstruction}</p>
                      <p className="text-xs text-slate-500">{medicine.quantity} {medicine.unit} left</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Take Pill Schedule" icon={<CalendarDays className="w-5 h-5 text-teal-600" />}>
                <div className="space-y-3">
                  {profileReminders.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No reminders for today.</p>
                  ) : null}
                  {profileReminders.map((reminder) => {
                    const medicine = medicines.find((item) => item.id === reminder.medicineId);
                    return (
                      <div key={reminder.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-slate-900">{reminder.time} - {medicine?.name}</p>
                          <p className="text-sm text-slate-500 capitalize">{reminder.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Expiry & Restock" icon={<AlertTriangle className="w-5 h-5 text-teal-600" />}>
                <div className="space-y-3">
                  {profileMedicines.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No active medicines.</p>
                  ) : null}
                  {profileMedicines.map((medicine) => (
                    <div key={medicine.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-slate-900">{medicine.name}</p>
                        <p className="text-sm text-slate-500">Expires {medicine.expiryDate}</p>
                      </div>
                      <span className={medicine.quantity <= medicine.lowStockAt ? 'text-red-600 text-sm font-medium' : 'text-green-700 text-sm font-medium'}>
                        {medicine.quantity <= medicine.lowStockAt ? 'Restock' : 'OK'}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Allergies & Interactions" icon={<Heart className="w-5 h-5 text-teal-600" />}>
                <p className="text-sm text-slate-600 mb-3"><span className="font-medium text-slate-900">Known allergies:</span> {selectedMember?.knownAllergies}</p>
                {warnings.length ? (
                  warnings.map((medicine) => <p key={medicine.id} className="text-sm font-medium text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {medicine.name} may need review.</p>)
                ) : (
                  <p className="text-sm font-medium text-green-700 flex items-center gap-2"><Shield className="w-4 h-4" /> No allergy conflicts detected.</p>
                )}
              </Panel>

              <Panel title="Medicine Uses" icon={<Stethoscope className="w-5 h-5 text-teal-600" />}>
                {profileMedicines.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No active medicines.</p>
                ) : null}
                {profileMedicines.map((medicine) => (
                  <div key={medicine.id} className="border-b border-slate-100 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                    <p className="font-medium text-slate-900">{medicine.name}</p>
                    <p className="text-sm text-slate-600">{medicine.use}</p>
                  </div>
                ))}
              </Panel>

              <Panel title="Caregiver Access" icon={<Shield className="w-5 h-5 text-teal-600" />}>
                <div className="space-y-3">
                  {caregivers.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No caregivers added.</p>
                  ) : null}
                  {caregivers.map((caregiver) => (
                    <div key={caregiver.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-slate-900">{caregiver.name}</p>
                        <p className="text-sm text-slate-500">{caregiver.relationship} - {caregiver.accessLevel}</p>
                        {(caregiver.phone || caregiver.email) && <p className="text-xs text-slate-500">{[caregiver.phone, caregiver.email].filter(Boolean).join(' - ')}</p>}
                        {caregiver.notes && <p className="text-xs text-slate-500 mt-1">{caregiver.notes}</p>}
                      </div>
                      <Button onClick={() => removeCaregiver(caregiver.id)} size="sm" variant="outline">Remove</Button>
                    </div>
                  ))}
                  <Button onClick={() => setIsAddingCaretaker(true)} className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-none border border-slate-200">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add caretaker
                  </Button>
                </div>
              </Panel>

              <Panel title="Monthly Report" icon={<BarChart3 className="w-5 h-5 text-teal-600" />}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-teal-100 flex items-center justify-center">
                    <span className="text-xl font-bold text-teal-700">{profileReminders.filter((item) => item.status === 'taken').length}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Today's Adherence</p>
                    <p className="text-sm text-slate-600">{profileReminders.filter((item) => item.status === 'taken').length} of {profileReminders.length} doses marked taken today.</p>
                  </div>
                </div>
              </Panel>

              <Panel title="Pharmacy Reorder" icon={<ShoppingCart className="w-5 h-5 text-teal-600" />}>
                <div className="space-y-3">
                  {profileMedicines.filter((medicine) => medicine.quantity <= medicine.lowStockAt).length === 0 ? (
                    <p className="text-sm text-green-700 font-medium">All medicines are fully stocked!</p>
                  ) : null}
                  {profileMedicines.filter((medicine) => medicine.quantity <= medicine.lowStockAt).map((medicine) => (
                    <div key={medicine.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <p className="font-medium text-slate-900">{medicine.name}</p>
                      <Button asChild size="sm" variant="outline" className="text-teal-700 border-teal-200 hover:bg-teal-50">
                        <a href={`https://www.google.com/search?q=buy+${encodeURIComponent(medicine.name)}`} target="_blank" rel="noreferrer">
                          Find pharmacy
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          </main>
        </div>
      </div>

      {isCreatingProfile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200 sm:zoom-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Create Family Profile</h2>
              <button onClick={() => setIsCreatingProfile(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProfile} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Role/Relationship</label>
                  <input 
                    required
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    placeholder="e.g. Spouse"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Age</label>
                  <input 
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    placeholder="e.g. 34"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Gender</label>
                <select 
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option>Unspecified</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Known Allergies</label>
                <input 
                  value={newAllergies}
                  onChange={(e) => setNewAllergies(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="e.g. Penicillin, Peanuts (leave blank if none)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Health Notes (comma separated)</label>
                <textarea 
                  value={newHealthNotes}
                  onChange={(e) => setNewHealthNotes(e.target.value)}
                  className="min-h-24 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="e.g. High blood pressure, Asthma"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreatingProfile(false)}>Cancel</Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">Save Profile</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingCaretaker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200 sm:zoom-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Add Caretaker</h2>
              <button onClick={() => setIsAddingCaretaker(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!caretakerName.trim()) return;
              try {
                await addCaregiver({ 
                  name: caretakerName.trim(), 
                  relationship: caretakerRelationship, 
                  accessLevel: caretakerAccessLevel as any,
                  phone: caretakerContact.trim(),
                  email: caretakerEmail.trim(),
                  notes: caretakerNotes.trim(),
                });
                setIsAddingCaretaker(false);
                setCaretakerName('');
                setCaretakerContact('');
                setCaretakerEmail('');
                setCaretakerRelationship('Son');
                setCaretakerAccessLevel('Full Access');
                setCaretakerNotes('');
              } catch (error) {
                console.error(error);
                alert("Failed to add caretaker");
              }
            }} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input 
                  required
                  value={caretakerName}
                  onChange={(e) => setCaretakerName(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="e.g. John Smith"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Relationship</label>
                  <input 
                    required
                    value={caretakerRelationship}
                    onChange={(e) => setCaretakerRelationship(e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    placeholder="e.g. Son, Daughter, Nurse"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Access Level</label>
                  <select 
                    value={caretakerAccessLevel}
                    onChange={(e) => setCaretakerAccessLevel(e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option>Full Access</option>
                    <option>View Only</option>
                    <option>Emergency Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input 
                    value={caretakerContact}
                    onChange={(e) => setCaretakerContact(e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    placeholder="e.g. +1 234 567 8900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input 
                    type="email"
                    value={caretakerEmail}
                    onChange={(e) => setCaretakerEmail(e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    placeholder="e.g. email@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea 
                  value={caretakerNotes}
                  onChange={(e) => setCaretakerNotes(e.target.value)}
                  className="min-h-24 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="e.g. Call only after 5 PM"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddingCaretaker(false)}>Cancel</Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">Save Caretaker</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingMedicine && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200 sm:zoom-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add Pill for {selectedMember.name}</h2>
                <p className="text-sm text-slate-500">Reminder times entered here will create today&apos;s dose schedule automatically.</p>
              </div>
              <button onClick={() => setIsAddingMedicine(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
              <MedicineField label="Medicine name" value={medicineForm.name} onChange={(value) => setMedicineForm({ ...medicineForm, name: value })} required />
              <MedicineField label="Strength" value={medicineForm.strength} onChange={(value) => setMedicineForm({ ...medicineForm, strength: value })} placeholder="500mg" />
              <MedicineField label="Type" value={medicineForm.type} onChange={(value) => setMedicineForm({ ...medicineForm, type: value })} />
              <MedicineField label="Quantity" type="number" value={String(medicineForm.quantity)} onChange={(value) => setMedicineForm({ ...medicineForm, quantity: Number(value) })} />
              <MedicineField label="Unit" value={medicineForm.unit} onChange={(value) => setMedicineForm({ ...medicineForm, unit: value })} />
              <MedicineField label="Expiry date" type="date" min={minExpiryDate} value={medicineForm.expiryDate} onChange={(value) => setMedicineForm({ ...medicineForm, expiryDate: value })} required />
              <MedicineField label="Simple use" value={medicineForm.use} onChange={(value) => setMedicineForm({ ...medicineForm, use: value })} placeholder="Blood pressure, fever, etc." required />
              <MedicineField label="Dosage" value={medicineForm.dosage} onChange={(value) => setMedicineForm({ ...medicineForm, dosage: value })} />
              <MedicineField label="Meal instruction" value={medicineForm.mealInstruction} onChange={(value) => setMedicineForm({ ...medicineForm, mealInstruction: value })} />
              <MedicineField label="Reminder times" value={medicineForm.reminderTimes} onChange={(value) => setMedicineForm({ ...medicineForm, reminderTimes: value })} placeholder="08:00, 20:00" />
              <MedicineField label="Low stock at" type="number" value={String(medicineForm.lowStockAt)} onChange={(value) => setMedicineForm({ ...medicineForm, lowStockAt: Number(value) })} />
              <MedicineField label="Pharmacy / pharma" value={medicineForm.pharmaName} onChange={(value) => setMedicineForm({ ...medicineForm, pharmaName: value })} placeholder="Optional" />
              {medicineFormError && <p className="md:col-span-3 text-sm font-medium text-red-600">{medicineFormError}</p>}
              <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddingMedicine(false)}>Cancel</Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700">Save pill and reminders</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function isFutureDate(date: string) {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return target.getTime() > today.getTime();
}

function MedicineField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      {label}
      <input
        required={required}
        type={type}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-slate-300 px-3"
      />
    </label>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
        {icon}
        {title}
      </h3>
      <div className="flex-1 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}
