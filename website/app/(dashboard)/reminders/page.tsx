'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarClock, ChevronLeft, Check, Clock, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/app-store';
import { toast } from '@/hooks/use-toast';

export default function RemindersPage() {
  const { todayReminders, medicines, members, user, getMember, markDose, deleteReminder, addReminder, expiringMedicines, lowStockMedicines, expiredReminders, removeExpiredReminder } = useAppStore();
  // Find the logged-in user's own member profile
  const myMember = members.find(m => m.uid === user.uid);
  const isElderly = user.elderMode || user.accessLevel === 'Elderly';
  const isLeader = user.accessLevel === 'Leader' || (!user.elderMode && !myMember);
  const [medicineId, setMedicineId] = useState(medicines[0]?.id ?? '');
  const [time, setTime] = useState('08:00');
  const [selectedProfileId, setSelectedProfileId] = useState('all');

  useEffect(() => {
    if (!medicineId && medicines[0]?.id) {
      setMedicineId(medicines[0].id);
    }
  }, [medicineId, medicines]);

  const selectedMedicine = medicines.find((medicine) => medicine.id === medicineId);

  const submitReminder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMedicine) return;

    await addReminder({
      medicineId: selectedMedicine.id,
      memberId: selectedMedicine.assignedToId,
      time,
    });
  };

  const handleMarkDose = async (reminderId: string, status: 'taken' | 'missed') => {
    const reminder = todayReminders.find(r => r.id === reminderId);
    const medicine = medicines.find(m => m.id === reminder?.medicineId);

    await markDose(reminderId, status);

    // Check if stock just hit the threshold after marking taken
    if (status === 'taken' && medicine) {
      const newQuantity = medicine.quantity - 1;
      const threshold = Math.max(medicine.lowStockAt || 5, 5);
      if (newQuantity <= threshold && newQuantity > 0) {
        toast({
          title: `⚠️ Low Stock: ${medicine.name}`,
          description: `Only ${newQuantity} ${medicine.unit} left. Auto-added to Purchase List.`,
        });
      } else if (newQuantity === 0) {
        toast({
          title: `🚨 Out of Stock: ${medicine.name}`,
          description: `No ${medicine.unit} remaining! Please restock immediately.`,
        });
      }
    }
  };

  // Elderly users only see their own reminders; Standard and Leaders see all
  const isRestricted = isElderly;
  const baseReminders = isRestricted && myMember
    ? todayReminders.filter(r => r.memberId === myMember.id)
    : todayReminders;

  const filteredReminders = selectedProfileId === 'all'
    ? baseReminders
    : baseReminders.filter((r) => r.memberId === selectedProfileId);

  const sortedReminders = [...filteredReminders].sort((a, b) => {
    if (typeof a.time !== 'string' || typeof b.time !== 'string') return 0;
    const [h1, m1] = a.time.split(':').map(Number);
    const [h2, m2] = b.time.split(':').map(Number);
    return h1 * 60 + m1 - (h2 * 60 + m2);
  });

  const escalatedReminders = todayReminders.filter((r) => {
    if (r.status === 'taken' || typeof r.time !== 'string') return false;
    const [h, m] = r.time.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(h, m, 0, 0);
    const thirtyMinsAgo = new Date();
    thirtyMinsAgo.setMinutes(thirtyMinsAgo.getMinutes() - 30);
    return r.status === 'missed' || reminderTime < thirtyMinsAgo;
  });

  return (
    <>
      <div className="page-panel space-y-5 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">Reminders</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">Track pill reminders.</p>
          </div>
        {!isRestricted && (
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="min-h-11 w-full sm:w-64 rounded-lg border border-slate-300 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="all">All Members</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        </div>

        {/* Leader-only: missed dose alerts across all members */}
        {isLeader && (
          (() => {
            const allMissed = todayReminders.filter(r => r.status === 'missed');
            if (allMissed.length === 0) return null;
            return (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 mb-2 shadow-sm">
                <h2 className="flex items-center gap-2 font-bold text-orange-800 text-base mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  Missed Doses — Household Alert
                </h2>
                <div className="space-y-2">
                  {allMissed.map(reminder => {
                    const medicine = medicines.find(m => m.id === reminder.medicineId);
                    const member = getMember(reminder.memberId);
                    return (
                      <div key={`leader-missed-${reminder.id}`} className="flex items-center justify-between bg-white p-3 rounded-lg border border-orange-100">
                        <div>
                          <p className="font-semibold text-orange-900 text-sm">{member?.name ?? 'Unknown'} missed a dose</p>
                          <p className="text-xs text-orange-700">{medicine?.name ?? 'Unknown medicine'} — scheduled at {reminder.time}</p>
                        </div>
                        <Button onClick={() => markDose(reminder.id, 'taken')} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs">
                          Acknowledge
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        )}

        {escalatedReminders.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-red-800 text-lg mb-3">
              <AlertTriangle className="w-5 h-5" />
              Caregiver Escalation Alerts
            </h2>
            <div className="space-y-3">
              {escalatedReminders.map(reminder => {
                const medicine = medicines.find(m => m.id === reminder.medicineId);
                const member = getMember(reminder.memberId);
                return (
                  <div key={`alert-${reminder.id}`} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-100">
                    <div>
                      <p className="font-semibold text-red-900">{member?.name} missed a dose!</p>
                      <p className="text-sm text-red-700">{medicine?.name} was scheduled for {reminder.time}</p>
                    </div>
                    <Button onClick={() => markDose(reminder.id, 'taken')} size="sm" className="bg-red-600 hover:bg-red-700">
                      Acknowledge
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}


        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white lg:col-span-2">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Today&apos;s dose schedule</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {filteredReminders.length === 0 && (
                <div className="p-8 text-center text-slate-600">No reminders for the selected profile.</div>
              )}
              {filteredReminders.map((reminder) => {
                const medicine = medicines.find((item) => item.id === reminder.medicineId);
                const member = getMember(reminder.memberId);

                return (
                  <div key={reminder.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between md:p-5">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-teal-50 font-bold text-teal-700">
                        {reminder.time}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{medicine?.name || 'Unknown Medicine'}</p>
                        <p className="text-sm text-slate-600">{medicine ? `${medicine.dosage} - ${medicine.mealInstruction}` : '-'}</p>
                        <p className="text-xs text-slate-500 mt-1">{member ? `${member.name} (${member.role})` : 'Unassigned'}</p>
                        <span className="inline-flex mt-2 px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs capitalize">
                          {reminder.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                      {reminder.status === 'taken' ? (
                        <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <Check className="w-4 h-4" /> Taken {reminder.takenAt ? new Date(reminder.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      ) : reminder.status === 'missed' ? (
                        <span className="text-sm font-medium text-red-700 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <X className="w-4 h-4" /> Missed
                        </span>
                      ) : (
                        <>
                          <Button onClick={() => handleMarkDose(reminder.id, 'taken')} size="sm" className="bg-green-600 hover:bg-green-700">
                            <Check className="w-4 h-4" />
                            Taken
                          </Button>
                          <Button onClick={() => handleMarkDose(reminder.id, 'missed')} size="sm" variant="outline" className="text-red-600">
                            <X className="w-4 h-4" />
                            Missed
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => deleteReminder(reminder.id)}
                        size="icon-sm"
                        variant="ghost"
                        className="text-red-600"
                        aria-label={`Delete reminder for ${medicine?.name ?? 'medicine'} at ${reminder.time}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-amber-200 p-5 space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-amber-600" />
                Expiry reminders
              </h2>
              {expiredReminders.length === 0 && expiringMedicines.length === 0 ? (
                <p className="text-sm text-slate-600">No active expiry alerts right now.</p>
              ) : (
                <div className="space-y-3">
                  {expiredReminders.map((rem) => (
                    <div key={rem.id} className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-red-900 flex items-center gap-1.5 text-sm">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          Expired: {rem.medicineName}
                        </p>
                        <p className="text-xs text-red-700 mt-0.5">Expired on {rem.expiryDate}. Removed from inventory.</p>
                      </div>
                      <Button
                        onClick={() => removeExpiredReminder(rem.id)}
                        size="icon-sm"
                        variant="ghost"
                        className="text-red-700 hover:bg-red-100 shrink-0"
                        aria-label={`Remove expired reminder for ${rem.medicineName}`}
                        title="Remove reminder"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {expiringMedicines.map((medicine) => {
                    const member = getMember(medicine.assignedToId);
                    return (
                      <div key={medicine.id} className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                        <p className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Expiring soon: {medicine.name}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">Expires {medicine.expiryDate}{member ? ` - ${member.name}` : ''}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                Add reminder
              </h2>
              {medicines.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Add a pill first. Its reminder times will show up here automatically.</p>
                  <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                    <Link href="/inventory">Add medicine</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={submitReminder} className="space-y-3">
                  <label className="space-y-2 text-sm font-medium text-slate-700 block">
                    Medicine
                    <select
                      value={medicineId}
                      onChange={(event) => setMedicineId(event.target.value)}
                      className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
                    >
                      {medicines.map((medicine) => {
                        const member = members.find((item) => item.id === medicine.assignedToId);
                        return <option key={medicine.id} value={medicine.id}>{medicine.name} - {member?.name ?? 'Unassigned'}</option>;
                      })}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700 block">
                    Time
                    <input
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      className="min-h-11 w-full rounded-lg border border-slate-300 px-3"
                    />
                  </label>
                  <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Save reminder
                  </Button>
                </form>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Restock alerts
              </h2>
              {lowStockMedicines.length === 0 ? (
                <p className="text-sm text-slate-600">No low-stock medicines right now.</p>
              ) : (
                <div className="space-y-3">
                  {lowStockMedicines.map((medicine) => (
                    <div key={medicine.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-900">{medicine.name}</p>
                      <p className="text-xs text-slate-600">{medicine.quantity} {medicine.unit} left. Restock threshold is {medicine.lowStockAt}.</p>
                    </div>
                  ))}
                  <Button asChild variant="outline" className="w-full border-amber-300 text-amber-800 hover:bg-amber-50">
                    <Link href="/purchase-list">Open purchase list</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                Reminder rules
              </h2>
              <div className="space-y-3 text-sm text-slate-600">
                <p>App reminders can be created manually or generated from medicine reminder times.</p>
                <p>Low-stock reminders trigger when quantity reaches the medicine&apos;s threshold.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
