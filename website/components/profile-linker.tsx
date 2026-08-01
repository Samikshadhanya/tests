'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/app-store';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, AlertCircle } from 'lucide-react';

export default function ProfileLinker() {
  const { user, members, linkProfile, addMember, loading } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState(user.name || '');
  const [newRole, setNewRole] = useState('Member');
  const [newAge, setNewAge] = useState('');
  const [processing, setProcessing] = useState(false);

  // We only show this if they are logged in, the household has members,
  // AND they haven't claimed a profile yet.
  const hasLinkedProfile = members.some((m) => m.uid === user.uid);
  const needsProfile = !loading && user.uid && members.length > 0 && !hasLinkedProfile;

  if (!needsProfile) return null;

  // Filter members that haven't been claimed yet
  const availableMembers = members.filter((m) => !m.uid);

  const handleClaim = async (memberId: string) => {
    setProcessing(true);
    try {
      await linkProfile(memberId);
    } catch (e: any) {
      alert('Failed to claim profile: ' + e.message);
      setProcessing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setProcessing(true);
    try {
      await addMember({
        name: newName,
        role: newRole,
        age: newAge || 'Not specified',
        gender: 'Unspecified',
        healthNotes: [],
        knownAllergies: 'None known',
        accessLevel: 'Standard',
        uid: user.uid, // Immediately link to current user
      });
      // The addMember function will update state and then this modal will disappear
    } catch (e: any) {
      alert('Failed to create profile: ' + e.message);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="mb-6 flex items-center gap-3 text-teal-600">
          <AlertCircle className="h-8 w-8" />
          <h2 className="text-xl font-bold text-slate-900">Welcome to the Household!</h2>
        </div>
        
        <p className="mb-6 text-sm text-slate-600">
          You've successfully joined, but we need to know who you are in this household. 
          Please select your profile from the existing family members, or create a new one.
        </p>

        {!isCreating ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Claim an existing profile:</h3>
            {availableMembers.length === 0 ? (
              <p className="text-sm text-slate-500 italic border p-3 rounded bg-slate-50">
                No unclaimed profiles available.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <img src={member.image} alt={member.name} className="h-10 w-10 rounded-full" />
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role} • Age {member.age}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleClaim(member.id)}
                      disabled={processing}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      It's me
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">Or</span></div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-dashed border-2 border-slate-300 text-slate-600 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50"
              onClick={() => setIsCreating(true)}
              disabled={processing}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Create a New Profile
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4 border-t border-slate-100 pt-4">
            <h3 className="font-semibold text-slate-900 mb-2">Create your profile</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                required
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role in family</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="Host">Host</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Caregiver">Caregiver</option>
                <option value="Member">Member</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Age (optional)</label>
              <input
                type="number"
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. 45"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} disabled={processing}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={processing}>
                Create Profile
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
