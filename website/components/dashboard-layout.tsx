'use client';

import { useEffect, useState } from 'react';
import Sidebar from './sidebar';
import Header from './header';
import ProtectedRoute from './protected-route';
import AIChatDrawer from './ai-chat-drawer';
import ProfileLinker from './profile-linker';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <ProtectedRoute>
      <div className="app-shell flex bg-slate-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 h-full min-w-0 flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          <main className="app-content min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>

        <AIChatDrawer />
        <ProfileLinker />
      </div>
    </ProtectedRoute>
  );
}
