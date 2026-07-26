'use client';

import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Medicine, useAppStore } from '@/lib/app-store';
import { daysUntil, formatExpiryStatus } from '@/lib/date-utils';
import { MedicineAvatar } from '@/components/medicine-avatar';

interface MedicineTableProps {
  medicines: Medicine[];
  showDelete?: boolean;
}

export default function MedicineTable({ medicines, showDelete = false }: MedicineTableProps) {
  const { user, members, getMember, deleteMedicine, updateMedicine } = useAppStore();
  const hasUidLinkedMember = members.some(m => m.uid === user.uid);
  const myMember = members.find(m =>
    m.uid === user.uid ||
    (!hasUidLinkedMember && m.name.toLowerCase() === user.name.toLowerCase())
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quantityDraft, setQuantityDraft] = useState('');

  const startEdit = (medicine: Medicine) => {
    setEditingId(medicine.id);
    setQuantityDraft(String(medicine.quantity));
  };

  const saveEdit = async (medicine: Medicine) => {
    const quantity = Number(quantityDraft);
    if (!Number.isFinite(quantity) || quantity < 0) return;

    await updateMedicine(medicine.id, { quantity });
    setEditingId(null);
    setQuantityDraft('');
  };

  return (
    <div className="space-y-3 md:rounded-lg md:border md:border-slate-200 md:bg-white md:overflow-hidden">
      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {medicines.map((medicine) => {
          const member = getMember(medicine.assignedToId);
          const daysLeft = daysUntil(medicine.expiryDate);
          const urgent = (daysLeft >= 0 && daysLeft <= 30) || medicine.quantity <= medicine.lowStockAt;
          const isMine = medicine.assignedToId === myMember?.id;
          const canModify = user.accessLevel !== 'Standard' || isMine;

          return (
            <article key={medicine.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <MedicineAvatar name={medicine.name} type={medicine.type} image={medicine.image} showColorBadge={true} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-slate-900">{medicine.name}</h3>
                  <p className="text-xs text-slate-500">{medicine.category}{medicine.use ? ` - ${medicine.use}` : ''}</p>
                  <p className="mt-1 text-sm text-slate-600">{member ? `${member.name} (${member.role})` : 'Unassigned'}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Quantity</p>
                  {editingId === medicine.id ? (
                    <input
                      type="number"
                      min={0}
                      value={quantityDraft}
                      onChange={(event) => setQuantityDraft(event.target.value)}
                      className="mt-1 min-h-11 w-full rounded border border-slate-300 px-3 text-sm"
                      aria-label={`Quantity for ${medicine.name}`}
                    />
                  ) : (
                    <p className="mt-1 font-semibold text-slate-900">{medicine.quantity} {medicine.unit}</p>
                  )}
                  {medicine.quantity <= medicine.lowStockAt && <p className="mt-1 text-xs font-medium text-red-600">Low stock</p>}
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Expiry</p>
                  <p className={`mt-1 font-semibold ${urgent ? 'text-orange-600' : 'text-slate-900'}`}>{medicine.expiryDate || 'No date set'}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatExpiryStatus(medicine.expiryDate)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {editingId === medicine.id ? (
                  <>
                    <Button onClick={() => saveEdit(medicine)} variant="outline" size="sm" className="text-green-700" aria-label={`Save ${medicine.name}`}>
                      <Check className="h-4 w-4" />
                      Save
                    </Button>
                    <Button onClick={() => setEditingId(null)} variant="ghost" size="sm" aria-label={`Cancel editing ${medicine.name}`}>
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  canModify && (
                    <Button onClick={() => startEdit(medicine)} variant="outline" size="sm" aria-label={`Edit ${medicine.name}`}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  )
                )}
                {showDelete && canModify && (
                  <Button
                    onClick={() => deleteMedicine(medicine.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    aria-label={`Delete ${medicine.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Medicine</th>
              <th className="px-6 py-3 font-semibold">Assigned To</th>
              <th className="px-6 py-3 font-semibold">Stock</th>
              <th className="px-6 py-3 font-semibold">Expiry</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {medicines.map((medicine) => {
              const member = getMember(medicine.assignedToId);
              const daysLeft = daysUntil(medicine.expiryDate);
              const urgent = (daysLeft >= 0 && daysLeft <= 30) || medicine.quantity <= medicine.lowStockAt;
              const isMine = medicine.assignedToId === myMember?.id;
              const canModify = user.accessLevel !== 'Standard' || isMine;

              return (
                <tr key={medicine.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <MedicineAvatar name={medicine.name} type={medicine.type} image={medicine.image} showColorBadge={true} size="md" />
                      <div>
                        <p className="font-semibold text-slate-900">{medicine.name}</p>
                        <p className="text-xs text-slate-500">{medicine.strength || medicine.category}{medicine.use ? ` • ${medicine.use}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 md:px-6">
                    {member ? (
                      <div className="flex items-center gap-2">
                        <img src={member.image} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-sm text-slate-700 font-medium">{member.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-4 md:px-6">
                    {editingId === medicine.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={quantityDraft}
                          onChange={(e) => setQuantityDraft(e.target.value)}
                          className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{medicine.quantity}</span>
                        <span className="text-slate-500">{medicine.unit}</span>
                      </div>
                    )}
                    {medicine.quantity <= medicine.lowStockAt && <p className="text-xs text-red-600 mt-1">Low stock</p>}
                  </td>
                  <td className="px-4 py-4 md:px-6">
                    <span className={urgent ? 'text-orange-600' : 'text-slate-600'}>{medicine.expiryDate || 'No date set'}</span>
                    <p className="text-xs text-slate-500 mt-1">{formatExpiryStatus(medicine.expiryDate)}</p>
                  </td>
                  <td className="px-4 py-4 md:px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === medicine.id ? (
                        <>
                          <Button onClick={() => saveEdit(medicine)} variant="outline" size="sm" className="text-green-700" aria-label={`Save ${medicine.name}`}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => setEditingId(null)} variant="ghost" size="sm" aria-label={`Cancel editing ${medicine.name}`}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        canModify && (
                          <Button onClick={() => startEdit(medicine)} variant="ghost" size="sm" aria-label={`Edit ${medicine.name}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )
                      )}
                      {showDelete && canModify && (
                        <Button
                          onClick={() => deleteMedicine(medicine.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          aria-label={`Delete ${medicine.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
