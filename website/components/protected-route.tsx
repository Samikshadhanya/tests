'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/app-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { loading, user } = useAppStore();
  const isAuthenticated = Boolean(user.uid);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/signin');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center text-sm font-medium text-slate-600">
        Loading MedHome...
      </div>
    );
  }

  return <>{children}</>;
}
