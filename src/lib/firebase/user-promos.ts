import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { Promo } from '@/types/promo';

const USER_PROMOS_COLLECTION = 'userPromos';

export interface UserPromo {
  id: string;
  userId: string;
  promoId: string;
  promo: Promo;
  status: 'active' | 'used';
  usedAt?: Date;
  createdAt: Date;
}

/**
 * Mark a promo as used by the user
 */
export async function markPromoAsUsed(
  userId: string,
  promoId: string
): Promise<{ success: boolean; error?: string; userPromoId?: string }> {
  try {
    // Check if user promo already exists
    const userPromosRef = collection(db, USER_PROMOS_COLLECTION);
    const q = query(
      userPromosRef,
      where('userId', '==', userId),
      where('promoId', '==', promoId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing user promo
      const userPromoDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, USER_PROMOS_COLLECTION, userPromoDoc.id), {
        status: 'used',
        usedAt: Timestamp.now()
      });
      return { success: true, userPromoId: userPromoDoc.id };
    } else {
      // Create new user promo record
      const promoDocRef = doc(db, 'promos', promoId);
      const promoDoc = await getDoc(promoDocRef);
      
      if (!promoDoc.exists()) {
        return { success: false, error: 'Promo not found' };
      }
      
      const promoData = promoDoc.data();
      const docRef = await addDoc(collection(db, USER_PROMOS_COLLECTION), {
        userId,
        promoId,
        promo: {
          ...promoData,
          id: promoId,
          createdAt: promoData.createdAt?.toDate() || new Date(),
          updatedAt: promoData.updatedAt?.toDate() || new Date(),
          startDate: promoData.startDate?.toDate(),
          endDate: promoData.endDate?.toDate()
        },
        status: 'used',
        usedAt: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      
      return { success: true, userPromoId: docRef.id };
    }
  } catch (error: any) {
    console.error('Error marking promo as used:', error);
    return { success: false, error: 'Failed to mark promo as used' };
  }
}

/**
 * Check if a promo is used by the user
 */
export async function isPromoUsed(
  userId: string,
  promoId: string
): Promise<boolean> {
  try {
    const userPromosRef = collection(db, USER_PROMOS_COLLECTION);
    const q = query(
      userPromosRef,
      where('userId', '==', userId),
      where('promoId', '==', promoId),
      where('status', '==', 'used')
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error: any) {
    console.error('Error checking if promo is used:', error);
    return false;
  }
}

/**
 * Get all used promos for a user
 */
export async function getUserUsedPromos(userId: string): Promise<{ success: boolean; promos?: UserPromo[]; error?: string }> {
  try {
    // First try with orderBy, if it fails (missing index), try without
    let q = query(
      collection(db, USER_PROMOS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'used'),
      orderBy('usedAt', 'desc')
    );
    
    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (indexError: any) {
      // If index error, try without orderBy
      if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
        console.warn('Firestore index not found, fetching without orderBy');
        q = query(
          collection(db, USER_PROMOS_COLLECTION),
          where('userId', '==', userId),
          where('status', '==', 'used')
        );
        querySnapshot = await getDocs(q);
      } else {
        throw indexError;
      }
    }
    
    const promos: UserPromo[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      promos.push({
        id: doc.id,
        userId: data.userId,
        promoId: data.promoId,
        promo: {
          ...data.promo,
          createdAt: data.promo.createdAt?.toDate() || new Date(),
          updatedAt: data.promo.updatedAt?.toDate() || new Date(),
          startDate: data.promo.startDate?.toDate(),
          endDate: data.promo.endDate?.toDate()
        } as Promo,
        status: data.status,
        usedAt: data.usedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });

    // Sort by usedAt descending if we didn't use orderBy
    promos.sort((a, b) => {
      const aDate = a.usedAt?.getTime() || 0;
      const bDate = b.usedAt?.getTime() || 0;
      return bDate - aDate;
    });

    console.log(`Found ${promos.length} used promos for user ${userId}`);
    return { success: true, promos };
  } catch (error: any) {
    console.error('Error getting user used promos:', error);
    return { success: false, error: error.message || 'Failed to get user used promos' };
  }
}

