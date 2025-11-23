import { db } from './config';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, getDocs, writeBatch } from 'firebase/firestore';
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

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'registration' | 'phone_verification' | 'pet_creation' | 'pet_share' | 'app_share' | 'admin_adjustment' | 'prize_claim';
  points: number;
  description?: string;
  metadata?: any;
  createdAt: Date;
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
 * Add a transaction record to the points transactions collection
 */
export async function addPointsTransaction(
  user: User,
  type: PointsTransaction['type'],
  points: number,
  description?: string,
  metadata?: any
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    const transactionData = {
      userId: user.uid,
      type,
      points,
      description: description || `${type} transaction`,
      metadata: metadata || {},
      createdAt: new Date()
    };

    const transactionRef = await addDoc(collection(db, 'pointsTransactions'), transactionData);
    
    console.log('Transaction recorded:', transactionRef.id, transactionData);
    return { success: true, transactionId: transactionRef.id };
  } catch (error: any) {
    console.error('Error recording transaction:', error);
    return { success: false, error: 'Failed to record transaction' };
  }
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(
  user: User,
  limit: number = 50
): Promise<{ success: boolean; transactions?: PointsTransaction[]; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    const transactionsQuery = query(
      collection(db, 'pointsTransactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(transactionsQuery);
    const transactions: PointsTransaction[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        points: data.points,
        description: data.description,
        metadata: data.metadata,
        createdAt: data.createdAt.toDate()
      });
    });

    return { success: true, transactions: transactions.slice(0, limit) };
  } catch (error: any) {
    console.error('Error getting user transactions:', error);
    return { success: false, error: 'Failed to get transactions' };
  }
}

/**
 * Add points to a specific category with transaction logging
 */
export async function addPointsToCategory(
  user: User,
  category: 'registration' | 'phone' | 'pet' | 'share',
  points: number,
  description?: string,
  metadata?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    // Use batch write for atomicity
    const batch = writeBatch(db);

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

    const totalPoints = newBreakdown.registration + newBreakdown.phone + newBreakdown.pet + newBreakdown.share;

    // Update user points
    const pointsDocRef = doc(db, 'userPoints', user.uid);
    const pointsData = {
      uid: user.uid,
      email: user.email,
      pointsBreakdown: newBreakdown,
      totalPoints,
      lastUpdated: new Date()
    };

    batch.set(pointsDocRef, pointsData, { merge: true });

    // Add transaction record
    const transactionRef = doc(collection(db, 'pointsTransactions'));
    const transactionData = {
      userId: user.uid,
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

    console.log(`Successfully added ${points} points to ${category} for user ${user.uid}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error adding points:', error);
    return { success: false, error: 'Failed to add points' };
  }
}

/**
 * Deduct points from a specific category with transaction logging
 */
export async function deductPointsFromCategory(
  user: User,
  category: 'registration' | 'phone' | 'pet' | 'share',
  points: number,
  description?: string,
  metadata?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    // Use batch write for atomicity
    const batch = writeBatch(db);

    // First get current points
    const currentPointsResult = await getUserPoints(user);
    if (!currentPointsResult.success || !currentPointsResult.points) {
      return { success: false, error: 'Failed to get current points' };
    }

    const currentBreakdown = currentPointsResult.points.pointsBreakdown;
    
    // Check if user has enough points in the category
    if (currentBreakdown[category] < points) {
      return { success: false, error: 'Insufficient points in this category' };
    }

    const newBreakdown = {
      ...currentBreakdown,
      [category]: Math.max(0, currentBreakdown[category] - points)
    };

    const totalPoints = newBreakdown.registration + newBreakdown.phone + newBreakdown.pet + newBreakdown.share;

    // Update user points
    const pointsDocRef = doc(db, 'userPoints', user.uid);
    const pointsData = {
      uid: user.uid,
      email: user.email,
      pointsBreakdown: newBreakdown,
      totalPoints,
      lastUpdated: new Date()
    };

    batch.set(pointsDocRef, pointsData, { merge: true });

    // Add transaction record (negative points)
    const transactionRef = doc(collection(db, 'pointsTransactions'));
    const transactionData = {
      userId: user.uid,
      type: category === 'phone' ? 'phone_verification' : 
            category === 'pet' ? 'pet_creation' : 
            category === 'share' ? 'app_share' : 'registration',
      points: -points, // Negative for deduction
      description: description || `${category} points deducted`,
      metadata: metadata || {},
      createdAt: new Date()
    };

    batch.set(transactionRef, transactionData);

    // Commit the batch
    await batch.commit();

    console.log(`Successfully deducted ${points} points from ${category} for user ${user.uid}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deducting points:', error);
    return { success: false, error: 'Failed to deduct points' };
  }
}

/**
 * Recalculate user points from transaction history (for data integrity)
 */
export async function recalculateUserPoints(
  user: User
): Promise<{ success: boolean; points?: UserPoints; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get all transactions for the user
    const transactionsResult = await getUserTransactions(user, 1000);
    if (!transactionsResult.success || !transactionsResult.transactions) {
      return { success: false, error: 'Failed to get transactions' };
    }

    // Calculate points breakdown from transactions
    const pointsBreakdown = {
      registration: 0,
      phone: 0,
      pet: 0,
      share: 0
    };

    transactionsResult.transactions.forEach(transaction => {
      switch (transaction.type) {
        case 'registration':
          pointsBreakdown.registration += transaction.points;
          break;
        case 'phone_verification':
          pointsBreakdown.phone += transaction.points;
          break;
        case 'pet_creation':
          pointsBreakdown.pet += transaction.points;
          break;
        case 'app_share':
        case 'pet_share':
          pointsBreakdown.share += transaction.points;
          break;
      }
    });

    const totalPoints = pointsBreakdown.registration + pointsBreakdown.phone + pointsBreakdown.pet + pointsBreakdown.share;

    const recalculatedPoints: UserPoints = {
      uid: user.uid,
      email: user.email,
      pointsBreakdown,
      totalPoints,
      lastUpdated: new Date()
    };

    // Update the user points with recalculated values
    await updateUserPoints(user, pointsBreakdown);

    console.log('Recalculated points for user:', user.uid, recalculatedPoints);
    return { success: true, points: recalculatedPoints };
  } catch (error: any) {
    console.error('Error recalculating points:', error);
    return { success: false, error: 'Failed to recalculate points' };
  }
}
