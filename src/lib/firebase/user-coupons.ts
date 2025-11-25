import { db } from './config';
import { collection, doc, addDoc, getDocs, updateDoc, query, where, orderBy, writeBatch, getDoc, Timestamp } from 'firebase/firestore';
import { Coupon } from '@/types/coupon';

export interface UserCoupon {
  id: string;
  userId: string;
  couponId: string;
  coupon: Coupon;
  purchasedAt: Date;
  status: 'active' | 'used' | 'expired';
  usedAt?: Date;
}

const USER_COUPONS_COLLECTION = 'userCoupons';

/**
 * Purchase a coupon for a user
 */
export async function purchaseCoupon(
  userId: string,
  coupon: Coupon,
  pointsDeducted: number
): Promise<{ success: boolean; error?: string; userCouponId?: string }> {
  try {
    // Allow users to purchase the same voucher multiple times
    // Create user coupon document
    const userCouponData = {
      userId,
      couponId: coupon.id,
      couponCode: coupon.description, // Store coupon code at top level for easy querying
      coupon: {
        id: coupon.id,
        name: coupon.name,
        description: coupon.description, // This is the coupon code
        price: coupon.price,
        points: coupon.points,
        imageUrl: coupon.imageUrl,
        validFrom: coupon.validFrom instanceof Date ? Timestamp.fromDate(coupon.validFrom) : coupon.validFrom,
        validTo: coupon.validTo instanceof Date ? Timestamp.fromDate(coupon.validTo) : coupon.validTo,
      },
      purchasedAt: Timestamp.now(),
      status: 'active' as const,
      pointsDeducted
    };

    const docRef = await addDoc(collection(db, USER_COUPONS_COLLECTION), userCouponData);

    return { success: true, userCouponId: docRef.id };
  } catch (error: any) {
    console.error('Error purchasing coupon:', error);
    return { success: false, error: 'Failed to purchase coupon' };
  }
}

/**
 * Get all purchased coupons for a user
 */
export async function getUserCoupons(userId: string): Promise<{ success: boolean; coupons?: UserCoupon[]; error?: string }> {
  try {
    const q = query(
      collection(db, USER_COUPONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('purchasedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const coupons: UserCoupon[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const validFrom = data.coupon.validFrom?.toDate() || new Date();
      const validTo = data.coupon.validTo?.toDate() || new Date();
      const purchasedAt = data.purchasedAt?.toDate() || new Date();
      const usedAt = data.usedAt?.toDate();
      
      // Ensure status is properly set (default to 'active' if missing)
      const status = data.status || 'active';
      
      coupons.push({
        id: doc.id,
        userId: data.userId,
        couponId: data.couponId,
        coupon: {
          ...data.coupon,
          // Convert Date objects to ISO strings for serialization
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
        } as any, // Type assertion needed since we're using ISO strings
        purchasedAt: purchasedAt.toISOString(),
        status: status,
        usedAt: usedAt ? usedAt.toISOString() : undefined
      } as any); // Type assertion needed since we're using ISO strings
    });

    return { success: true, coupons };
  } catch (error: any) {
    console.error('Error getting user coupons:', error);
    return { success: false, error: 'Failed to get user coupons' };
  }
}

/**
 * Mark a coupon as used
 */
export async function markCouponAsUsed(userCouponId: string, metadata?: any): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, USER_COUPONS_COLLECTION, userCouponId);
    const updateData: any = {
      status: 'used',
      usedAt: Timestamp.now()
    };
    
    if (metadata) {
      updateData.metadata = metadata;
    }
    
    await updateDoc(docRef, updateData);

    return { success: true };
  } catch (error: any) {
    console.error('Error marking coupon as used:', error);
    return { success: false, error: 'Failed to mark coupon as used' };
  }
}

/**
 * Get active coupons (not expired, not used)
 * Once purchased, coupons remain active until explicitly used, regardless of validity dates
 */
export async function getActiveUserCoupons(userId: string): Promise<{ success: boolean; coupons?: UserCoupon[]; error?: string }> {
  try {
    const result = await getUserCoupons(userId);
    if (!result.success || !result.coupons) {
      return result;
    }

    // Filter only coupons with status 'active'
    // Don't check validity dates - once purchased, coupons stay active until used
    const activeCoupons = result.coupons.filter((userCoupon) => {
      return userCoupon.status === 'active';
    });

    return { success: true, coupons: activeCoupons };
  } catch (error: any) {
    console.error('Error getting active user coupons:', error);
    return { success: false, error: 'Failed to get active coupons' };
  }
}

/**
 * Get coupon history (all purchased coupons - active, used, and expired)
 */
export async function getCouponHistory(userId: string): Promise<{ success: boolean; coupons?: UserCoupon[]; error?: string }> {
  try {
    const result = await getUserCoupons(userId);
    if (!result.success || !result.coupons) {
      return result;
    }

    // Return all purchased coupons (active, used, and expired)
    return { success: true, coupons: result.coupons };
  } catch (error: any) {
    console.error('Error getting coupon history:', error);
    return { success: false, error: 'Failed to get coupon history' };
  }
}

/**
 * Get a user coupon by ID
 */
export async function getUserCouponById(userCouponId: string): Promise<{ success: boolean; userCoupon?: UserCoupon; error?: string }> {
  try {
    const docRef = doc(db, USER_COUPONS_COLLECTION, userCouponId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Voucher not found' };
    }

    const data = docSnap.data();
    const validFrom = data.coupon.validFrom?.toDate() || new Date();
    const validTo = data.coupon.validTo?.toDate() || new Date();
    const purchasedAt = data.purchasedAt?.toDate() || new Date();
    const usedAt = data.usedAt?.toDate();
    const status = data.status || 'active';

    const userCoupon: UserCoupon = {
      id: docSnap.id,
      userId: data.userId,
      couponId: data.couponId,
      coupon: {
        ...data.coupon,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
      } as any,
      purchasedAt: purchasedAt.toISOString(),
      status: status,
      usedAt: usedAt ? usedAt.toISOString() : undefined
    } as any;

    return { success: true, userCoupon };
  } catch (error: any) {
    console.error('Error getting user coupon by ID:', error);
    return { success: false, error: 'Failed to get voucher' };
  }
}

/**
 * Mark coupon as expired
 */
async function markCouponAsExpired(userCouponId: string): Promise<void> {
  try {
    const docRef = doc(db, USER_COUPONS_COLLECTION, userCouponId);
    await updateDoc(docRef, {
      status: 'expired'
    });
  } catch (error) {
    console.error('Error marking coupon as expired:', error);
  }
}

