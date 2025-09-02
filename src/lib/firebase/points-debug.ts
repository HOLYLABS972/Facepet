import { db } from './config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { getUserPoints, getUserTransactions, recalculateUserPoints } from './points';

/**
 * Debug function to check points consistency for a user
 */
export async function debugUserPoints(user: User): Promise<{
  success: boolean;
  data?: {
    currentPoints: any;
    transactions: any[];
    calculatedPoints: any;
    isConsistent: boolean;
    discrepancies: string[];
  };
  error?: string;
}> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log(`🔍 Debugging points for user: ${user.uid} (${user.email})`);

    // Get current points from userPoints collection
    const currentPointsResult = await getUserPoints(user);
    if (!currentPointsResult.success || !currentPointsResult.points) {
      return { success: false, error: 'Failed to get current points' };
    }

    // Get transaction history
    const transactionsResult = await getUserTransactions(user, 1000);
    if (!transactionsResult.success || !transactionsResult.transactions) {
      return { success: false, error: 'Failed to get transactions' };
    }

    // Calculate points from transactions
    const calculatedBreakdown = {
      registration: 0,
      phone: 0,
      pet: 0,
      share: 0
    };

    transactionsResult.transactions.forEach(transaction => {
      switch (transaction.type) {
        case 'registration':
          calculatedBreakdown.registration += transaction.points;
          break;
        case 'phone_verification':
          calculatedBreakdown.phone += transaction.points;
          break;
        case 'pet_creation':
          calculatedBreakdown.pet += transaction.points;
          break;
        case 'app_share':
        case 'pet_share':
          calculatedBreakdown.share += transaction.points;
          break;
      }
    });

    const calculatedTotal = calculatedBreakdown.registration + calculatedBreakdown.phone + calculatedBreakdown.pet + calculatedBreakdown.share;

    // Check for discrepancies
    const discrepancies: string[] = [];
    const current = currentPointsResult.points.pointsBreakdown;
    const calculated = calculatedBreakdown;

    if (current.registration !== calculated.registration) {
      discrepancies.push(`Registration points: current=${current.registration}, calculated=${calculated.registration}`);
    }
    if (current.phone !== calculated.phone) {
      discrepancies.push(`Phone points: current=${current.phone}, calculated=${calculated.phone}`);
    }
    if (current.pet !== calculated.pet) {
      discrepancies.push(`Pet points: current=${current.pet}, calculated=${calculated.pet}`);
    }
    if (current.share !== calculated.share) {
      discrepancies.push(`Share points: current=${current.share}, calculated=${calculated.share}`);
    }
    if (currentPointsResult.points.totalPoints !== calculatedTotal) {
      discrepancies.push(`Total points: current=${currentPointsResult.points.totalPoints}, calculated=${calculatedTotal}`);
    }

    const isConsistent = discrepancies.length === 0;

    const debugData = {
      currentPoints: currentPointsResult.points,
      transactions: transactionsResult.transactions,
      calculatedPoints: {
        breakdown: calculatedBreakdown,
        total: calculatedTotal
      },
      isConsistent,
      discrepancies
    };

    console.log('📊 Points Debug Results:', debugData);

    return { success: true, data: debugData };
  } catch (error: any) {
    console.error('Error debugging user points:', error);
    return { success: false, error: 'Failed to debug points' };
  }
}

/**
 * Fix points inconsistencies by recalculating from transactions
 */
export async function fixUserPoints(user: User): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log(`🔧 Fixing points for user: ${user.uid}`);

    // First debug to see what's wrong
    const debugResult = await debugUserPoints(user);
    if (!debugResult.success || !debugResult.data) {
      return { success: false, error: 'Failed to debug points' };
    }

    if (debugResult.data.isConsistent) {
      return { success: true, message: 'Points are already consistent' };
    }

    // Recalculate points from transactions
    const recalculateResult = await recalculateUserPoints(user);
    if (!recalculateResult.success) {
      return { success: false, error: 'Failed to recalculate points' };
    }

    console.log('✅ Points fixed successfully for user:', user.uid);
    return { success: true, message: 'Points have been recalculated and fixed' };
  } catch (error: any) {
    console.error('Error fixing user points:', error);
    return { success: false, error: 'Failed to fix points' };
  }
}

/**
 * Get all users with points inconsistencies (admin function)
 */
export async function getAllUsersWithPointsIssues(): Promise<{
  success: boolean;
  users?: Array<{
    uid: string;
    email: string;
    issues: string[];
  }>;
  error?: string;
}> {
  try {
    console.log('🔍 Checking all users for points inconsistencies...');

    // Get all userPoints documents
    const userPointsQuery = query(collection(db, 'userPoints'));
    const userPointsSnapshot = await getDocs(userPointsQuery);

    const usersWithIssues: Array<{ uid: string; email: string; issues: string[] }> = [];

    for (const doc of userPointsSnapshot.docs) {
      const userData = doc.data();
      const user: User = {
        uid: userData.uid,
        email: userData.email,
        displayName: null,
        photoURL: null,
        phoneNumber: null,
        providerId: '',
        uid: userData.uid,
        emailVerified: false,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({})
      };

      const debugResult = await debugUserPoints(user);
      if (debugResult.success && debugResult.data && !debugResult.data.isConsistent) {
        usersWithIssues.push({
          uid: userData.uid,
          email: userData.email,
          issues: debugResult.data.discrepancies
        });
      }
    }

    console.log(`📊 Found ${usersWithIssues.length} users with points issues`);
    return { success: true, users: usersWithIssues };
  } catch (error: any) {
    console.error('Error checking all users for points issues:', error);
    return { success: false, error: 'Failed to check users' };
  }
}
