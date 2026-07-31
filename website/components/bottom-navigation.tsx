'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Home, Package, ShoppingCart, Users } from 'lucide-react';
import { useAppStore } from '@/lib/app-store';

const tabs = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Users, label: 'Family', href: '/family-profiles' },
  { icon: Package, label: 'Meds', href: '/inventory' },
  { icon: Bell, label: 'Doses', href: '/reminders' },
  { icon: ShoppingCart, label: 'Buy', href: '/purchase-list' },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { todayReminders } = useAppStore();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          const showBadge = tab.href === '/reminders' && todayReminders.length > 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold transition active:scale-95 ${
                active ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className={`grid h-7 w-10 place-items-center rounded-full transition ${active ? 'bg-teal-50' : ''}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="leading-none">{tab.label}</span>
              {showBadge && (
                <span className="absolute right-3 top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 text-white">
                  {todayReminders.length > 99 ? '99+' : todayReminders.length}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
