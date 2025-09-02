'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  createNotificationWithPoints,
  Notification 
} from '../lib/firebase/notifications';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  createActionNotification: (actionType: Notification['actionType']) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Load notifications when user changes
  useEffect(() => {
    const loadNotifications = async () => {
      if (user) {
        console.log('NotificationsContext: Loading notifications for user:', user.uid);
        setIsLoading(true);
        try {
          const result = await getUserNotifications(user, 50, true); // Get all notifications
          console.log('NotificationsContext: getUserNotifications result:', result);
          if (result.success && result.notifications) {
            setNotifications(result.notifications);
            console.log('NotificationsContext: Loaded notifications for user:', user.uid, result.notifications.length);
          } else {
            console.log('NotificationsContext: No notifications found or error:', result.error);
          }
        } catch (error) {
          console.error('NotificationsContext: Error loading notifications:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('NotificationsContext: No user, clearing notifications');
        setNotifications([]);
      }
    };

    loadNotifications();
  }, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const result = await markAllNotificationsAsRead(user);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotificationById = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.filter(n => n.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await getUserNotifications(user, 50, true);
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create action notification with points
  const createActionNotificationById = async (actionType: Notification['actionType']) => {
    if (!user) return;
    
    try {
      console.log('NotificationsContext: Creating notification for action:', actionType);
      const result = await createNotificationWithPoints(user, actionType);
      console.log('NotificationsContext: Notification creation result:', result);
      if (result.success) {
        // Refresh notifications to show the new one
        console.log('NotificationsContext: Refreshing notifications...');
        await refreshNotifications();
        console.log('NotificationsContext: Notifications refreshed, current count:', notifications.length);
      }
    } catch (error) {
      console.error('Error creating action notification:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationById,
    refreshNotifications,
    createActionNotification: createActionNotificationById
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
