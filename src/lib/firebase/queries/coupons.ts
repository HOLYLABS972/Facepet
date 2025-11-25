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
import { Coupon, CreateCouponData, UpdateCouponData } from '@/types/coupon';

const COUPONS_COLLECTION = 'coupons';

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

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const q = query(collection(db, COUPONS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Coupon[];
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw new Error('Failed to fetch coupons');
  }
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  try {
    const docRef = doc(db, COUPONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
      } as Coupon;
    }
    return null;
  } catch (error) {
    console.error('Error fetching coupon:', error);
    throw new Error('Failed to fetch coupon');
  }
}

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

export async function deleteCoupon(id: string): Promise<void> {
  try {
    const docRef = doc(db, COUPONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw new Error('Failed to delete coupon');
  }
}

export async function getActiveCoupons(): Promise<Coupon[]> {
  try {
    const q = query(
      collection(db, COUPONS_COLLECTION), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Coupon[];
  } catch (error) {
    console.error('Error fetching active coupons:', error);
    throw new Error('Failed to fetch active coupons');
  }
}

export async function getCouponsByBusiness(businessId: string): Promise<Coupon[]> {
  try {
    const q = query(
      collection(db, COUPONS_COLLECTION), 
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      validFrom: doc.data().validFrom?.toDate() || new Date(),
      validTo: doc.data().validTo?.toDate() || new Date()
    })) as Coupon[];
  } catch (error) {
    console.error('Error fetching coupons by business:', error);
    throw new Error('Failed to fetch coupons by business');
  }
}
