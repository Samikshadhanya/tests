'use client';

import { ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/lib/app-store';

export default function ReportsPage() {
  const { medicines, members, todayReminders, lowStockMedicines, expiringMedicines } = useAppStore();
  const taken = todayReminders.filter((item) => item.status === 'taken').length;
  const adherence = todayReminders.length ? Math.round((taken / todayReminders.length) * 100) : 0;
  
  const attentionMedicines = Array.from(new Map([...lowStockMedicines, ...expiringMedicines].map(m => [m.id, m])).values());

  return (
    <>
      <div className="page-panel space-y-5 p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-4">

          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">Reports</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">Monthly household medicine summary.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ReportCard label="Family members" value={members.length} />
          <ReportCard label="Medicines tracked" value={medicines.length} />
          <ReportCard label="Dose adherence" value={`${adherence}%`} />
          <ReportCard label="Needs attention" value={attentionMedicines.length} />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-bold text-slate-900 mb-4">Medicine distribution</h2>
            <div className="space-y-3">
              {members.map((member) => {
                const count = medicines.filter((medicine) => medicine.assignedToId === member.id).length;
                return (
                  <div key={member.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{member.name}</span>
                      <span className="text-slate-500">{count} medicines</span>
                    </div>
                    <div className="h-2 rounded bg-slate-100 overflow-hidden">
                      <div className="h-full bg-teal-600" style={{ width: `${Math.max(8, (count / Math.max(1, medicines.length)) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-bold text-slate-900 mb-4">Attention list</h2>
            <div className="space-y-3">
              {attentionMedicines.map((medicine) => (
                <div key={`${medicine.id}-report`} className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{medicine.name}</p>
                    <p className="text-sm text-slate-500">{medicine.quantity} {medicine.unit} left - expires {medicine.expiryDate}</p>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Review</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ReportCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">{value}</p>
    </div>
  );
}
