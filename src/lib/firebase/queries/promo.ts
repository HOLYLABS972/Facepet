import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config';
import { Audience, Business, Coupon, Promo, CreateAudienceData, CreateBusinessData, CreateCouponData, CreatePromoData, UpdateAudienceData, UpdateBusinessData, UpdateCouponData, UpdatePromoData } from '@/types/promo';

// AUDIENCE QUERIES
const AUDIENCES_COLLECTION = 'audiences';

export async function createAudience(audienceData: CreateAudienceData, createdBy: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, AUDIENCES_COLLECTION), {
      ...audienceData,
      isActive: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating audience:', error);
    throw new Error('Failed to create audience');
  }
}

export async function getAudiences(): Promise<Audience[]> {
  try {
    const q = query(collection(db, AUDIENCES_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Audience[];
  } catch (error) {
    console.error('Error fetching audiences:', error);
    throw new Error('Failed to fetch audiences');
  }
}

export async function updateAudience(id: string, updateData: UpdateAudienceData): Promise<void> {
  try {
    const docRef = doc(db, AUDIENCES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating audience:', error);
    throw new Error('Failed to update audience');
  }
}

export async function deleteAudience(id: string): Promise<void> {
  try {
    const docRef = doc(db, AUDIENCES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting audience:', error);
    throw new Error('Failed to delete audience');
  }
}

// BUSINESS QUERIES
const BUSINESSES_COLLECTION = 'businesses';

export async function createBusiness(businessData: CreateBusinessData, createdBy: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BUSINESSES_COLLECTION), {
      ...businessData,
      isActive: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating business:', error);
    throw new Error('Failed to create business');
  }
}

export async function getBusinesses(): Promise<Business[]> {
  try {
    const q = query(collection(db, BUSINESSES_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Business[];
  } catch (error) {
    console.error('Error fetching businesses:', error);
    throw new Error('Failed to fetch businesses');
  }
}

export async function updateBusiness(id: string, updateData: UpdateBusinessData): Promise<void> {
  try {
    const docRef = doc(db, BUSINESSES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating business:', error);
    throw new Error('Failed to update business');
  }
}

export async function deleteBusiness(id: string): Promise<void> {
  try {
    const docRef = doc(db, BUSINESSES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting business:', error);
    throw new Error('Failed to delete business');
  }
}

// COUPON QUERIES (formerly PROMO)
const COUPONS_COLLECTION = 'promos'; // Keep collection name as 'promos' for now to avoid data migration

export async function createCoupon(couponData: CreateCouponData, createdBy: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COUPONS_COLLECTION), {
      ...couponData,
      isActive: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw new Error('Failed to create coupon');
  }
}

// Legacy alias
export const createPromo = createCoupon;

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const q = query(collection(db, COUPONS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      startDate: doc.data().startDate?.toDate() || undefined,
      endDate: doc.data().endDate?.toDate() || undefined
    })) as Coupon[];
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw new Error('Failed to fetch coupons');
  }
}

// Legacy alias
export const getPromos = getCoupons;

export async function getCouponById(id: string): Promise<Coupon | null> {
  try {
    const docRef = doc(db, COUPONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        startDate: docSnap.data().startDate?.toDate() || undefined,
        endDate: docSnap.data().endDate?.toDate() || undefined
      } as Coupon;
    }
    return null;
  } catch (error) {
    console.error('Error fetching coupon:', error);
    throw new Error('Failed to fetch coupon');
  }
}

// Legacy alias
export const getPromoById = getCouponById;

export async function updateCoupon(id: string, updateData: UpdateCouponData): Promise<void> {
  try {
    const docRef = doc(db, COUPONS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw new Error('Failed to update coupon');
  }
}

// Legacy alias
export const updatePromo = updateCoupon;

export async function deleteCoupon(id: string): Promise<void> {
  try {
    const docRef = doc(db, COUPONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw new Error('Failed to delete coupon');
  }
}

// Legacy alias
export const deletePromo = deleteCoupon;

export async function getCouponsByBusiness(businessId: string): Promise<Coupon[]> {
  try {
    const q = query(
      collection(db, COUPONS_COLLECTION), 
      where('businessId', '==', businessId)
    );
    const querySnapshot = await getDocs(q);
    
    const coupons = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      startDate: doc.data().startDate?.toDate() || undefined,
      endDate: doc.data().endDate?.toDate() || undefined
    })) as Coupon[];
    
    // Sort by createdAt in descending order (newest first)
    coupons.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return coupons;
  } catch (error) {
    console.error('Error fetching coupons by business:', error);
    throw new Error('Failed to fetch coupons by business');
  }
}

// Legacy alias
export const getPromosByBusiness = getCouponsByBusiness;

export async function getCouponsByAudience(audienceId: string): Promise<Coupon[]> {
  try {
    const q = query(
      collection(db, COUPONS_COLLECTION), 
      where('audienceId', '==', audienceId)
    );
    const querySnapshot = await getDocs(q);
    
    const coupons = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      startDate: doc.data().startDate?.toDate() || undefined,
      endDate: doc.data().endDate?.toDate() || undefined
    })) as Coupon[];
    
    // Sort by createdAt in descending order (newest first)
    coupons.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return coupons;
  } catch (error) {
    console.error('Error fetching coupons by audience:', error);
    throw new Error('Failed to fetch coupons by audience');
  }
}

// Legacy alias
export const getPromosByAudience = getCouponsByAudience;
