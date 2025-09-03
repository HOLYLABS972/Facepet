import { db } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface Notification {
  id: string;
  userId: string;
  type: 'action' | 'prize_available' | 'admin_message' | 'system_update' | 'pet_reminder';
  title: string;
  message: string;
  actionType?: 'registration' | 'phone_setup' | 'add_pet' | 'share' | 'prize_claim';
  isRead: boolean;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  metadata?: any;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationTemplate {
  id: string;
  type: Notification['type'];
  title: string;
  message: string;
  points?: number;
  actionType?: Notification['actionType'];
  priority: Notification['priority'];
  isActive: boolean;
  conditions?: {
    minPoints?: number;
    maxPoints?: number;
    userType?: 'new' | 'existing';
    hasPets?: boolean;
    hasPhone?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  notificationData: Omit<Notification, 'id' | 'userId' | 'createdAt'>
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const notification: Omit<Notification, 'id'> = {
      ...notificationData,
      userId,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      createdAt: Timestamp.fromDate(notification.createdAt),
      expiresAt: notification.expiresAt ? Timestamp.fromDate(notification.expiresAt) : null
    });

    console.log('Notification created:', docRef.id);
    return { success: true, notificationId: docRef.id };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  user: User,
  limitCount: number = 20,
  includeRead: boolean = false
): Promise<{ success: boolean; notifications?: Notification[]; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    let notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (!includeRead) {
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('isActive', '==', true),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(notificationsQuery);
    const notifications: Notification[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionType: data.actionType,
        isRead: data.isRead,
        isActive: data.isActive,
        priority: data.priority,
        metadata: data.metadata,
        createdAt: data.createdAt.toDate(),
        expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined
      });
    });

    return { success: true, notifications };
  } catch (error: any) {
    console.error('Error getting user notifications:', error);
    return { success: false, error: 'Failed to get notifications' };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });

    console.log('Notification marked as read:', notificationId);
    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  user: User
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(notificationsQuery);
    const batch = writeBatch(db);

    snapshot.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
    console.log('All notifications marked as read for user:', user.uid);
    return { success: true };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    console.log('Notification deleted:', notificationId);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}

/**
 * Create notification templates (admin function)
 */
export async function createNotificationTemplate(
  templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const template: Omit<NotificationTemplate, 'id'> = {
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'notificationTemplates'), {
      ...template,
      createdAt: Timestamp.fromDate(template.createdAt),
      updatedAt: Timestamp.fromDate(template.updatedAt)
    });

    console.log('Notification template created:', docRef.id);
    return { success: true, templateId: docRef.id };
  } catch (error: any) {
    console.error('Error creating notification template:', error);
    return { success: false, error: 'Failed to create notification template' };
  }
}

/**
 * Get notification templates
 */
export async function getNotificationTemplates(): Promise<{
  success: boolean;
  templates?: NotificationTemplate[];
  error?: string;
}> {
  try {
    const templatesQuery = query(
      collection(db, 'notificationTemplates'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(templatesQuery);
    const templates: NotificationTemplate[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        type: data.type,
        title: data.title,
        message: data.message,
        points: data.points,
        actionType: data.actionType,
        priority: data.priority,
        isActive: data.isActive,
        conditions: data.conditions,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      });
    });

    return { success: true, templates };
  } catch (error: any) {
    console.error('Error getting notification templates:', error);
    return { success: false, error: 'Failed to get notification templates' };
  }
}

/**
 * Check if user already has a notification of specific action type
 */
export async function hasNotificationOfType(
  user: User,
  actionType: Notification['actionType']
): Promise<{ success: boolean; hasNotification: boolean; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, hasNotification: false, error: 'User not authenticated' };
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('actionType', '==', actionType),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(notificationsQuery);
    return { success: true, hasNotification: !snapshot.empty };
  } catch (error: any) {
    console.error('Error checking notification existence:', error);
    return { success: false, hasNotification: false, error: 'Failed to check notification' };
  }
}

/**
 * Auto-create notifications based on user actions
 */
export async function createActionNotification(
  user: User,
  actionType: Notification['actionType']
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    // For share, registration, and phone_setup notifications, check if user already has one
    if (actionType === 'share' || actionType === 'registration' || actionType === 'phone_setup') {
      const hasNotification = await hasNotificationOfType(user, actionType);
      if (hasNotification.success && hasNotification.hasNotification) {
        console.log(`User already has a ${actionType} notification, skipping creation`);
        return { success: true }; // Return success but don't create duplicate
      }
    }

    const notificationData = {
      type: 'action' as const,
      title: getActionTitle(actionType),
      message: getActionMessage(actionType, 0), // No points
      actionType,
      isRead: false,
      isActive: true,
      priority: 'medium' as const,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    };

    return await createNotification(user.uid, notificationData);
  } catch (error: any) {
    console.error('Error creating action notification:', error);
    return { success: false, error: 'Failed to create action notification' };
  }
}

/**
 * Helper functions for notification content
 */
function getActionTitle(actionType: Notification['actionType']): string {
  switch (actionType) {
    case 'registration':
      return '🎉 Welcome to FacePet!';
    case 'phone_setup':
      return '📱 Phone Verified!';
    case 'add_pet':
      return '🐾 Pet Added!';
    case 'share':
      return '📤 Share Bonus!';
    case 'prize_claim':
      return '🎁 Prize Claimed!';
    default:
      return '🎯 Points Earned!';
  }
}

function getActionMessage(actionType: Notification['actionType'], points: number): string {
  switch (actionType) {
    case 'registration':
      return `Welcome to FacePet! Thanks for joining our community with 10 points.`;
    case 'phone_setup':
      return `Great! You verified your phone number with 10 points.`;
    case 'add_pet':
      return `Awesome! You added a pet to your profile with 10 points.`;
    case 'share':
      return `Thanks for sharing FacePet with 10 points!`;
    case 'prize_claim':
      return `Congratulations! You claimed your prize with 10 points.`;
    default:
      return `Action completed successfully with 10 points!`;
  }
}

/**
 * Create notification (without points transactions)
 * This function creates only the notification
 */
export async function createNotificationWithPoints(
  user: User,
  actionType: Notification['actionType']
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    // Create notification only (no points transactions)
    const notificationResult = await createActionNotification(user, actionType);
    if (!notificationResult.success) {
      return { success: false, error: 'Failed to create notification' };
    }

    console.log(`Created notification for ${actionType}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}
