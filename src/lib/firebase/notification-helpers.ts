import { User } from 'firebase/auth';
import { createNotificationWithPoints } from './notifications';

/**
 * Helper functions for common notification scenarios
 * Each notification gives 10 points
 */

/**
 * Create registration notification (10 points)
 */
export async function createRegistrationNotification(user: User) {
  return await createNotificationWithPoints(user, 'registration');
}

/**
 * Create phone setup notification (10 points)
 */
export async function createPhoneSetupNotification(user: User) {
  return await createNotificationWithPoints(user, 'phone_setup');
}

/**
 * Create add pet notification (10 points)
 */
export async function createAddPetNotification(user: User) {
  return await createNotificationWithPoints(user, 'add_pet');
}

/**
 * Create share notification (10 points)
 * Note: This is for non-share-button sharing (like manual sharing)
 * Share button should still use hardcoded points as requested
 */
export async function createShareNotification(user: User) {
  return await createNotificationWithPoints(user, 'share');
}

/**
 * Create prize claim notification (10 points)
 */
export async function createPrizeClaimNotification(user: User) {
  return await createNotificationWithPoints(user, 'prize_claim');
}

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
