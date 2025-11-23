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
import { Audience, Business, Promo, CreateAudienceData, CreateBusinessData, CreatePromoData, UpdateAudienceData, UpdateBusinessData, UpdatePromoData } from '@/types/promo';

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

// PROMO QUERIES
const PROMOS_COLLECTION = 'promos';

export async function createPromo(promoData: CreatePromoData, createdBy: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, PROMOS_COLLECTION), {
      ...promoData,
      isActive: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating promo:', error);
    throw new Error('Failed to create promo');
  }
}

export async function getPromos(): Promise<Promo[]> {
  try {
    const q = query(collection(db, PROMOS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      startDate: doc.data().startDate?.toDate() || undefined,
      endDate: doc.data().endDate?.toDate() || undefined
    })) as Promo[];
  } catch (error) {
    console.error('Error fetching promos:', error);
    throw new Error('Failed to fetch promos');
  }
}

export async function getPromoById(id: string): Promise<Promo | null> {
  try {
    const docRef = doc(db, PROMOS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        startDate: docSnap.data().startDate?.toDate() || undefined,
        endDate: docSnap.data().endDate?.toDate() || undefined
      } as Promo;
    }
    return null;
  } catch (error) {
    console.error('Error fetching promo:', error);
    throw new Error('Failed to fetch promo');
  }
}

export async function updatePromo(id: string, updateData: UpdatePromoData): Promise<void> {
  try {
    const docRef = doc(db, PROMOS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating promo:', error);
    throw new Error('Failed to update promo');
  }
}

export async function deletePromo(id: string): Promise<void> {
  try {
    const docRef = doc(db, PROMOS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting promo:', error);
    throw new Error('Failed to delete promo');
  }
}

export async function getPromosByBusiness(businessId: string): Promise<Promo[]> {
  try {
    const q = query(
      collection(db, PROMOS_COLLECTION), 
      where('businessId', '==', businessId)
    );
    const querySnapshot = await getDocs(q);
    
    const promos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      startDate: doc.data().startDate?.toDate() || undefined,
      endDate: doc.data().endDate?.toDate() || undefined
    })) as Promo[];
    
    // Sort by createdAt in descending order (newest first)
    promos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return promos;
  } catch (error) {
    console.error('Error fetching promos by business:', error);
    throw new Error('Failed to fetch promos by business');
  }
}

export async function getPromosByAudience(audienceId: string): Promise<Promo[]> {
  try {
    const q = query(
      collection(db, PROMOS_COLLECTION), 
      where('audienceId', '==', audienceId)
    );
    const querySnapshot = await getDocs(q);
    
    const promos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      startDate: doc.data().startDate?.toDate() || undefined,
      endDate: doc.data().endDate?.toDate() || undefined
    })) as Promo[];
    
    // Sort by createdAt in descending order (newest first)
    promos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return promos;
  } catch (error) {
    console.error('Error fetching promos by audience:', error);
    throw new Error('Failed to fetch promos by audience');
  }
}
