'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ReactNode } from 'react';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </AuthProvider>
  );
}


