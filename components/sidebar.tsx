'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Calendar,
  Download,
  Home,
  LayoutGrid,
  Package,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  X,
  Users,
} from 'lucide-react';
import { useAppStore } from '@/lib/app-store';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, todayReminders, expiringMedicines } = useAppStore();
  const isElderly = user.elderMode || user.accessLevel === 'Elderly';
  const reminderAlertCount = todayReminders.length + expiringMedicines.length;
  const menuItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard' },
    { icon: Sparkles, label: 'AI Assistant', href: '/ai-assistant' },
    ...(!isElderly ? [
      { icon: Users, label: 'Family Profiles', href: '/family-profiles' },
      { icon: Calendar, label: 'Appointments', href: '/appointments' },
      { icon: Package, label: 'Inventory', href: '/inventory' },
    ] : []),
    { icon: Bell, label: 'Reminders', href: '/reminders', count: isElderly ? 0 : reminderAlertCount },
    ...(!isElderly ? [
      { icon: ShoppingCart, label: 'Purchase List', href: '/purchase-list' },
      { icon: BarChart3, label: 'Reports', href: '/reports' },
      { icon: Download, label: 'Export Data', href: '/export' },
      { icon: ShieldAlert, label: 'Emergency SOS', href: '/emergency' },
    ] : []),
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <>
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed lg:static lg:translate-x-0 inset-y-0 left-0 z-50 flex w-[min(19rem,86vw)] lg:w-64 flex-col bg-slate-950 text-white shadow-2xl lg:shadow-none transition-transform duration-300 ease-out`}>
        <div className="flex items-center justify-between border-b border-slate-800 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <Link href="/dashboard" onClick={onClose} className="flex min-h-11 items-center gap-2 rounded hover:opacity-90">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-500">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">MedHome</span>
          </Link>
          <button onClick={onClose} className="grid lg:hidden min-h-11 min-w-11 place-items-center rounded-lg hover:bg-slate-800 transition" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 transition active:scale-[0.98] ${
                  isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.count ? (
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white text-teal-700' : 'bg-teal-500 text-white'}`}>
                    {item.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden" onClick={onClose} />}
    </>
  );
}
