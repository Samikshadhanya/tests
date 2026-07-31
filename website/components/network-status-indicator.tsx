'use client';

import React from 'react';
import { useOnlineStatus } from '@/lib/offline-detection';

export function NetworkStatusIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 text-sm font-medium">
      You are offline. Some features may not be available.
    </div>
  );
}
