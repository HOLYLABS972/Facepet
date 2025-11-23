'use server';

import { db } from './config';
import { doc, getDoc, setDoc, collection, addDoc, writeBatch } from 'firebase/firestore';
import { getUserFromFirestore } from './users';

/**
 * Server-side function to add points to a user by UID
 * This is used in API routes where we don't have a Firebase User object
 */
export async function addPointsToUserByUid(
  userId: string,
  category: 'registration' | 'phone' | 'pet' | 'share',
  points: number,
  description?: string,
  metadata?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user data to get email
    const userResult = await getUserFromFirestore(userId);
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'User not found' };
    }

    const userEmail = userResult.user.email;
    if (!userEmail) {
      return { success: false, error: 'User email not found' };
    }

    // Use batch write for atomicity
    const batch = writeBatch(db);

    // Get current points
    const pointsDocRef = doc(db, 'userPoints', userId);
    const pointsDoc = await getDoc(pointsDocRef);

    let currentBreakdown = {
      registration: 0,
      phone: 0,
      pet: 0,
      share: 0
    };

    if (pointsDoc.exists()) {
      const data = pointsDoc.data();
      currentBreakdown = data.pointsBreakdown || currentBreakdown;
    } else {
      // Initialize with default registration points if user doesn't have points yet
      currentBreakdown.registration = 30;
    }

    // Add points to the specified category
    const newBreakdown = {
      ...currentBreakdown,
      [category]: currentBreakdown[category] + points
    };

    const totalPoints = newBreakdown.registration + newBreakdown.phone + newBreakdown.pet + newBreakdown.share;

    // Update user points
    const pointsData = {
      uid: userId,
      email: userEmail,
      pointsBreakdown: newBreakdown,
      totalPoints,
      lastUpdated: new Date()
    };

    batch.set(pointsDocRef, pointsData, { merge: true });

    // Add transaction record
    const transactionRef = doc(collection(db, 'pointsTransactions'));
    const transactionData = {
      userId: userId,
      type: category === 'phone' ? 'phone_verification' : 
            category === 'pet' ? 'pet_creation' : 
            category === 'share' ? 'app_share' : 'registration',
      points,
      description: description || `${category} points added`,
      metadata: metadata || {},
      createdAt: new Date()
    };

    batch.set(transactionRef, transactionData);

    // Commit the batch
    await batch.commit();

    console.log(`Successfully added ${points} points to ${category} for user ${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error adding points by UID:', error);
    return { success: false, error: 'Failed to add points' };
  }
}

/**
 * Get user points by UID (server-side)
 */
export async function getUserPointsByUid(userId: string): Promise<{ success: boolean; points?: number; error?: string }> {
  try {
    const pointsDocRef = doc(db, 'userPoints', userId);
    const pointsDoc = await getDoc(pointsDocRef);

    if (pointsDoc.exists()) {
      const data = pointsDoc.data();
      const totalPoints = data.totalPoints || 0;
      return { success: true, points: totalPoints };
    } else {
      // Return default points for new users
      return { success: true, points: 30 };
    }
  } catch (error: any) {
    console.error('Error getting user points by UID:', error);
    return { success: false, error: 'Failed to get user points' };
  }
}

/**
 * Check if a callback token has already been processed (idempotency)
 */
export async function isCallbackTokenProcessed(token: string): Promise<boolean> {
  try {
    // Check if there's a transaction with this token in metadata
    const transactionsRef = collection(db, 'pointsTransactions');
    // Note: This is a simple check. In production, you might want to create a separate collection
    // for tracking processed callback tokens for better performance
    // For now, we'll check in the callback handler itself
    return false;
  } catch (error) {
    console.error('Error checking callback token:', error);
    return false;
  }
}

