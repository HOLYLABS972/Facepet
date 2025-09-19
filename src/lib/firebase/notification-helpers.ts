import { User } from 'firebase/auth';
import { createNotificationWithPoints } from './notifications';

/**
 * Helper functions for common notification scenarios
 * Notifications are created without points transactions
 */

/**
 * Create registration notification
 */
export async function createRegistrationNotification(user: User) {
  return await createNotificationWithPoints(user, 'registration');
}

/**
 * Create phone setup notification
 */
export async function createPhoneSetupNotification(user: User) {
  return await createNotificationWithPoints(user, 'phone_setup');
}

/**
 * Create add pet notification
 */
export async function createAddPetNotification(user: User) {
  return await createNotificationWithPoints(user, 'add_pet');
}

/**
 * Create share notification
 * Note: This is for non-share-button sharing (like manual sharing)
 */
export async function createShareNotification(user: User) {
  return await createNotificationWithPoints(user, 'share');
}

/**
 * Create prize claim notification - DISABLED
 */
// export async function createPrizeClaimNotification(user: User) {
//   return await createNotificationWithPoints(user, 'prize_claim');
// }

/**
 * Batch create multiple notifications for new users
 */
export async function createWelcomeNotifications(user: User) {
  try {
    // Create registration notification
    await createRegistrationNotification(user);
    
    // You can add more welcome notifications here
    // For example, if you want to give bonus points for completing profile setup
    
    console.log('Welcome notifications created for user:', user.uid);
    return { success: true };
  } catch (error) {
    console.error('Error creating welcome notifications:', error);
    return { success: false, error: 'Failed to create welcome notifications' };
  }
}
