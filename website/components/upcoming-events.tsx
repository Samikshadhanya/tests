'use client';

import Link from 'next/link';
import { CalendarPlus, Moon, ShoppingCart, Sun } from 'lucide-react';
import { useAppStore } from '@/lib/app-store';

export default function UpcomingEvents() {
  const { todayReminders, medicines, getMember, purchaseList } = useAppStore();
  const today = new Date();
  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = Array.from({ length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() }, (_, index) => index + 1);
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Pill & Restock Calendar</h3>
          <span className="text-sm font-medium text-slate-600">{monthLabel}</span>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-600">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} className="aspect-square" />)}
            {days.map((day) => (
              <div
                key={day}
                className={`aspect-square rounded flex items-center justify-center text-sm font-medium ${
                  day === today.getDate() ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h4 className="font-semibold text-slate-900 mb-4">Today</h4>
        <div className="space-y-3">
          {todayReminders.map((item) => {
            const medicine = medicines.find((med) => med.id === item.medicineId);
            const member = getMember(item.memberId);
            const Icon = typeof item.time === 'string' && Number(item.time.slice(0, 2)) >= 18 ? Moon : Sun;

            return (
              <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-slate-200 last:border-0">
                <Icon className="w-4 h-4 text-amber-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{item.time} - {medicine?.name}</p>
                  <p className="text-sm text-slate-600">{member?.name} - {medicine?.mealInstruction}</p>
                  <p className="text-xs text-slate-500 capitalize">{item.status}</p>
                </div>
              </div>
            );
          })}
          {(purchaseList || []).slice(0, 2).map((medicine) => (
            <div key={medicine.id} className="flex items-start gap-3 pb-3 border-b border-slate-200 last:border-0">
              <ShoppingCart className="w-4 h-4 text-teal-600 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">Restock: {medicine.name}</p>
                <p className="text-xs text-slate-500">Only {medicine.quantity} {medicine.unit} left</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/reminders" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-sm mt-3">
          <CalendarPlus className="w-4 h-4" />
          Manage schedule
        </Link>
      </div>
    </div>
  );
}
