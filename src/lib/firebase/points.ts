import { db } from './config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface UserPoints {
  uid: string;
  email: string;
  pointsBreakdown: {
    registration: number;
    phone: number;
    pet: number;
    share: number;
  };
  totalPoints: number;
  lastUpdated: Date;
}

/**
 * Get user points from Firestore
 */
export async function getUserPoints(
  user: User
): Promise<{ success: boolean; points?: UserPoints; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    const pointsDocRef = doc(db, 'userPoints', user.uid);
    const pointsDoc = await getDoc(pointsDocRef);

    if (pointsDoc.exists()) {
      const data = pointsDoc.data();
      return {
        success: true,
        points: {
          uid: data.uid,
          email: data.email,
          pointsBreakdown: data.pointsBreakdown,
          totalPoints: data.totalPoints,
          lastUpdated: data.lastUpdated.toDate()
        }
      };
    } else {
      // Create default points for new user
      const defaultPoints: UserPoints = {
        uid: user.uid,
        email: user.email,
        pointsBreakdown: {
          registration: 30,
          phone: 0,
          pet: 0,
          share: 0
        },
        totalPoints: 30,
        lastUpdated: new Date()
      };

      await setDoc(pointsDocRef, {
        ...defaultPoints,
        lastUpdated: new Date()
      });

      return { success: true, points: defaultPoints };
    }
  } catch (error: any) {
    console.error('Error getting user points:', error);
    return { success: false, error: 'Failed to get user points' };
  }
}

/**
 * Update user points in Firestore
 */
export async function updateUserPoints(
  user: User,
  pointsBreakdown: {
    registration: number;
    phone: number;
    pet: number;
    share: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!user?.email) {
      console.error('User not authenticated for points update');
      return { success: false, error: 'User not authenticated' };
    }

    const totalPoints = pointsBreakdown.registration + pointsBreakdown.phone + pointsBreakdown.pet + pointsBreakdown.share;

    console.log('Updating points for user:', user.uid, 'with breakdown:', pointsBreakdown, 'total:', totalPoints);

    const pointsDocRef = doc(db, 'userPoints', user.uid);
    const pointsData = {
      uid: user.uid,
      email: user.email,
      pointsBreakdown,
      totalPoints,
      lastUpdated: new Date()
    };

    console.log('Points data to save:', pointsData);

    await setDoc(pointsDocRef, pointsData, { merge: true });

    console.log('User points updated successfully:', user.uid, totalPoints);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user points:', error);
    return { success: false, error: 'Failed to update user points' };
  }
}

/**
 * Add points to a specific category
 */
export async function addPointsToCategory(
  user: User,
  category: 'registration' | 'phone' | 'pet' | 'share',
  points: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // First get current points
    const currentPointsResult = await getUserPoints(user);
    if (!currentPointsResult.success || !currentPointsResult.points) {
      return { success: false, error: 'Failed to get current points' };
    }

    const currentBreakdown = currentPointsResult.points.pointsBreakdown;
    const newBreakdown = {
      ...currentBreakdown,
      [category]: currentBreakdown[category] + points
    };

    return await updateUserPoints(user, newBreakdown);
  } catch (error: any) {
    console.error('Error adding points:', error);
    return { success: false, error: 'Failed to add points' };
  }
}
