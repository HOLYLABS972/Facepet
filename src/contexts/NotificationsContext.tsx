// TEMPORARY STUB - Firebase removed
// TODO: Rewrite for Supabase

'use client';

import { createContext, useContext, ReactNode } from 'react';

interface NotificationsContextType {
  notifications: any[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const value = {
    notifications: [],
    unreadCount: 0,
    markAsRead: (id: string) => { },
    markAllAsRead: () => { },
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
