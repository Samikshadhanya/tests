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
