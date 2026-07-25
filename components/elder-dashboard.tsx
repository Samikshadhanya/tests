'use client';

import React from 'react';
import { useAppStore } from '@/lib/app-store';
import { CheckCircle2, XCircle, PhoneCall, HeartPulse } from 'lucide-react';

export default function ElderDashboard() {
  const { user, members, medicines, todayReminders, markDose, caregivers } = useAppStore();

  const myMember = members.find(m => m.uid === user.uid);
  const myReminders = todayReminders.filter(r => r.memberId === myMember?.id);
  const upcomingReminders = myReminders.filter(r => r.status === 'upcoming');
  const pastReminders = myReminders.filter(r => r.status !== 'upcoming');

  const primaryCaregiver = caregivers && caregivers.length > 0 ? caregivers[0] : null;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900">Hello, {user.name}</h1>
        <p className="text-xl text-slate-700">Here are your medicines for today.</p>
      </div>

      {primaryCaregiver && (primaryCaregiver.phone) && (
        <div className="bg-red-50 border-4 border-red-200 rounded-3xl p-6 text-center space-y-3">
          <HeartPulse className="w-12 h-12 mx-auto text-red-500" />
          <h2 className="text-2xl font-bold text-red-900">Need Help?</h2>
          <p className="text-lg text-red-800">Contact {primaryCaregiver.name} ({primaryCaregiver.relationship})</p>
          <a href={`tel:${primaryCaregiver.phone}`} className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-2xl font-bold py-4 px-8 rounded-2xl transition-colors shadow-lg mt-2 w-full justify-center sm:w-auto">
            <PhoneCall className="w-8 h-8" />
            Call {primaryCaregiver.phone}
          </a>
        </div>
      )}

      {upcomingReminders.length === 0 ? (
        <div className="bg-teal-100 border-4 border-teal-500 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-24 h-24 mx-auto text-teal-600 mb-4" />
          <h2 className="text-3xl font-bold text-teal-900">All Done!</h2>
          <p className="text-xl text-teal-800 mt-2">You have no more medicines to take right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 border-b-4 border-slate-200 pb-2">To Take:</h2>
          {upcomingReminders.map(reminder => {
            const medicine = medicines.find(m => m.id === reminder.medicineId);
            if (!medicine) return null;
            
            return (
              <div key={reminder.id} className="bg-white border-4 border-slate-300 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-4xl font-black text-slate-900">{medicine.name}</h3>
                    <p className="text-2xl font-bold text-teal-700 mt-2">Time: {reminder.time}</p>
                    <p className="text-xl font-medium text-slate-600 mt-1">{medicine.dosage} - {medicine.mealInstruction}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-slate-100">
                  <button 
                    onClick={() => markDose(reminder.id, 'taken')}
                    className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-2xl font-bold py-6 px-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                    I Took It
                  </button>
                  <button 
                    onClick={() => markDose(reminder.id, 'missed')}
                    className="sm:w-auto w-full bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-800 text-xl font-bold py-6 px-8 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                    Skip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pastReminders.length > 0 && (
        <div className="pt-8">
          <h2 className="text-2xl font-bold text-slate-400 mb-4">Already Completed Today:</h2>
          <div className="space-y-3">
            {pastReminders.map(reminder => {
              const medicine = medicines.find(m => m.id === reminder.medicineId);
              return (
                <div key={reminder.id} className="bg-slate-100 rounded-xl p-4 flex justify-between items-center opacity-70">
                  <div>
                    <p className="text-xl font-bold text-slate-700">{medicine?.name}</p>
                    <p className="text-slate-500">{reminder.time}</p>
                  </div>
                  <span className={`text-lg font-bold px-4 py-2 rounded-lg ${reminder.status === 'taken' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {reminder.status === 'taken' ? 'Taken' : 'Skipped'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
