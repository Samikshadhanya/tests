'use client';

import { ChevronLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/app-store';
import { daysUntil } from '@/lib/date-utils';
import { MedicineAvatar } from '@/components/medicine-avatar';
import { getPillColor } from '@/lib/pill-color';

export default function PurchaseListPage() {
  const { purchaseList, getMember, updateMedicine } = useAppStore();

  return (
    <>
      <div className="page-panel space-y-5 p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-4">

          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">Purchase List</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">Medicines that need restocking soon.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {purchaseList.length === 0 ? (
            <div className="p-10 text-center text-slate-600">No medicines need restocking right now.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {purchaseList.map((medicine) => {
                const member = getMember(medicine.assignedToId);
                const color = getPillColor(medicine.name);
                return (
                  <div key={medicine.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
                    <div className="flex items-center gap-4">
                      <MedicineAvatar name={medicine.name} type={medicine.type} image={medicine.image} showColorBadge={true} size="lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{medicine.name}</p>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${color.badgeBg} ${color.badgeText} ${color.badgeBorder}`}>
                            Pill Color: {color.name}
                          </span>
                          {daysUntil(medicine.expiryDate) < 0 && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">(Expired)</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{member?.name} - only {medicine.quantity} {medicine.unit} left</p>
                        <p className="text-xs text-slate-500">Reorder 2 days before expected shortage.</p>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Button
                        onClick={() => {
                          const isExpired = daysUntil(medicine.expiryDate) < 0;
                          const updates: any = { quantity: medicine.quantity + 30 };
                          if (isExpired) {
                            const nextYear = new Date();
                            nextYear.setFullYear(nextYear.getFullYear() + 1);
                            updates.expiryDate = nextYear.toISOString().split('T')[0];
                          }
                          updateMedicine(medicine.id, updates);
                        }}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Mark restocked
                      </Button>
                      <Button asChild variant="outline">
                        <a
                          href={`https://www.google.com/search?q=buy+${encodeURIComponent(medicine.name)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Find pharmacy
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
