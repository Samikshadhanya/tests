'use client';

import { ShoppingCart, AlertTriangle, CheckCircle2, Package, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/app-store';
import { daysUntil } from '@/lib/date-utils';
import { MedicineAvatar } from '@/components/medicine-avatar';
import { getPillColor } from '@/lib/pill-color';
import type { Medicine, FamilyMember } from '@/lib/types';

export default function PurchaseListPage() {
  const { purchaseList, getMember, updateMedicine, medicines } = useAppStore();

  // Categorize by urgency
  const criticalItems = purchaseList.filter(m => m.quantity <= 2);
  const lowItems = purchaseList.filter(m => m.quantity > 2 && m.quantity <= 5);
  const restockItems = purchaseList.filter(m => m.quantity > 5);

  return (
    <>
      <div className="page-panel space-y-5 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">Purchase List</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              Medicines are <strong>automatically added</strong> here when stock drops below 5 units.
            </p>
          </div>
          {purchaseList.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
              <Zap className="h-4 w-4 text-teal-600" />
              <span><strong>{purchaseList.length}</strong> auto-flagged</span>
            </div>
          )}
        </div>

        {/* Auto-add explanation banner */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">How auto-detection works</p>
            <p className="mt-0.5 text-amber-800">
              When a medicine&apos;s quantity drops to <strong>5 or below</strong> (or its custom low-stock threshold), 
              it&apos;s automatically flagged here. Each dose marked &quot;taken&quot; reduces the count by 1.
            </p>
          </div>
        </div>

        {purchaseList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white p-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <p className="font-semibold text-slate-900 text-lg">All medicines are well-stocked!</p>
              <p className="text-sm text-slate-500 mt-1">
                You have {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} tracked. 
                Items will auto-appear here when stock drops below 5.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {criticalItems.length > 0 && (
              <PurchaseSection
                title="🔴 Critical — Order Immediately"
                items={criticalItems}
                getMember={getMember}
                updateMedicine={updateMedicine}
                borderClass="border-red-200 bg-red-50"
              />
            )}
            {lowItems.length > 0 && (
              <PurchaseSection
                title="🟡 Low Stock — Order Soon"
                items={lowItems}
                getMember={getMember}
                updateMedicine={updateMedicine}
                borderClass="border-amber-200 bg-amber-50"
              />
            )}
            {restockItems.length > 0 && (
              <PurchaseSection
                title="🔵 Below Custom Threshold"
                items={restockItems}
                getMember={getMember}
                updateMedicine={updateMedicine}
                borderClass="border-blue-200 bg-blue-50"
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}

function PurchaseSection({
  title,
  items,
  getMember,
  updateMedicine,
  borderClass,
}: {
  title: string;
  items: Medicine[];
  getMember: (id: string) => FamilyMember | undefined;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  borderClass: string;
}) {
  return (
    <div className={`rounded-lg border overflow-hidden ${borderClass}`}>
      <div className="px-5 py-3 border-b border-slate-200/60 font-semibold text-slate-800 text-sm flex items-center gap-2">
        <Package className="h-4 w-4" />
        {title}
        <span className="ml-auto text-xs font-medium text-slate-500">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="bg-white divide-y divide-slate-100">
        {items.map((medicine) => {
          const member = getMember(medicine.assignedToId);
          const color = getPillColor(medicine.name);
          const isExpired = daysUntil(medicine.expiryDate) < 0;
          const threshold = Math.max(medicine.lowStockAt || 5, 5);

          return (
            <div
              key={medicine.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5"
            >
              <div className="flex items-center gap-4">
                <MedicineAvatar
                  name={medicine.name}
                  type={medicine.type}
                  image={medicine.image}
                  showColorBadge={true}
                  size="lg"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{medicine.name}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${color.badgeBg} ${color.badgeText} ${color.badgeBorder}`}>
                      {color.name}
                    </span>
                    {isExpired && (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Expired
                      </span>
                    )}
                    <span className="text-xs font-semibold text-white bg-teal-600 px-2 py-0.5 rounded-full">
                      ⚡ Auto-flagged
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {member?.name ?? 'Unassigned'} —{' '}
                    <span className="font-semibold text-red-600">
                      {medicine.quantity} {medicine.unit}
                    </span>{' '}
                    left
                    <span className="text-slate-400 ml-1">(threshold: {threshold})</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Each dose marked &quot;taken&quot; reduces stock by 1.
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  onClick={() => {
                    const updates: Partial<Medicine> = { quantity: medicine.quantity + 30 };
                    if (isExpired) {
                      const nextYear = new Date();
                      nextYear.setFullYear(nextYear.getFullYear() + 1);
                      updates.expiryDate = nextYear.toISOString().split('T')[0];
                    }
                    updateMedicine(medicine.id, updates);
                  }}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Mark restocked (+30)
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
    </div>
  );
}
