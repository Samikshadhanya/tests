'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Trash2, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/app-store';

export default function AppointmentsPage() {
  const { appointments, members, addAppointment, deleteAppointment, getMember } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [memberId, setMemberId] = useState(members[0]?.id ?? '');
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !doctorName || !date || !time) return;

    await addAppointment({
      memberId,
      doctorName,
      specialty,
      date,
      time,
      location,
      notes,
    });

    setIsAdding(false);
    setDoctorName('');
    setSpecialty('');
    setDate('');
    setTime('');
    setLocation('');
    setNotes('');
  };

  const sortedAppointments = [...appointments].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  return (
    <>
      <div className="page-panel space-y-5 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">Appointments</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">Manage doctor visits and consultations.</p>
          </div>
          <Button onClick={() => setIsAdding(true)} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>

        <div className="space-y-4">
          {sortedAppointments.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
              No upcoming appointments. Schedule one today.
            </div>
          )}

          {sortedAppointments.map((apt) => {
            const member = getMember(apt.memberId);
            return (
              <div key={apt.id} className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition hover:border-teal-200">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 text-teal-600 shrink-0">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">Dr. {apt.doctorName} <span className="text-sm font-normal text-slate-500">({apt.specialty})</span></h3>
                  <p className="text-sm font-medium text-slate-700 mt-1">Patient: {member?.name}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {new Date(apt.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {apt.time}</span>
                    {apt.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {apt.location}</span>}
                  </div>
                  {apt.notes && <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-2 rounded">"{apt.notes}"</p>}
                </div>
                <div className="shrink-0 flex items-center justify-end">
                  <Button variant="ghost" className="text-red-600" onClick={() => deleteAppointment(apt.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl p-6 animate-in fade-in zoom-in">
            <h2 className="text-xl font-bold text-slate-900 mb-5">Schedule Appointment</h2>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Patient (Family Member)</label>
                <select 
                  required
                  value={memberId} 
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-teal-600"
                >
                  <option value="" disabled>Select member</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Doctor Name</label>
                  <input required value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm" placeholder="e.g. Smith" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Specialty</label>
                  <input required value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm" placeholder="e.g. Cardiologist" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Date</label>
                  <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Time</label>
                  <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Location/Clinic</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm" placeholder="e.g. City Hospital" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full min-h-24 rounded-lg border border-slate-300 p-3 text-sm" placeholder="Bring previous test reports..." />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700">Schedule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
