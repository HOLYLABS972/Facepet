import { db } from './config';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';

export interface VetClinic {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  isNamePrivate: boolean;
  isPhonePrivate: boolean;
  isEmailPrivate: boolean;
  isAddressPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VetSearchResult {
  success: boolean;
  vets?: VetClinic[];
  error?: string;
  hasMore?: boolean;
  lastDoc?: any;
}

/**
 * Search for veterinary clinics by name
 */
export async function searchVetClinics(
  searchTerm: string,
  limitCount: number = 10,
  lastDoc?: any
): Promise<VetSearchResult> {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, vets: [], hasMore: false };
    }

    const vetsRef = collection(db, 'vets');
    let q = query(
      vetsRef,
      where('name', '>=', searchTerm.trim()),
      where('name', '<=', searchTerm.trim() + '\uf8ff'),
      orderBy('name'),
      limit(limitCount)
    );

    // If we have a lastDoc, start after it for pagination
    if (lastDoc) {
      q = query(
        vetsRef,
        where('name', '>=', searchTerm.trim()),
        where('name', '<=', searchTerm.trim() + '\uf8ff'),
        orderBy('name'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const vets: VetClinic[] = [];
    let newLastDoc = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      vets.push({
        id: doc.id,
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        isNamePrivate: data.isNamePrivate || false,
        isPhonePrivate: data.isPhonePrivate || false,
        isEmailPrivate: data.isEmailPrivate || false,
        isAddressPrivate: data.isAddressPrivate || false,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
      });
      newLastDoc = doc;
    });

    return {
      success: true,
      vets,
      hasMore: vets.length === limitCount,
      lastDoc: newLastDoc
    };
  } catch (error) {
    console.error('Error searching vet clinics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get all veterinary clinics (for admin purposes)
 */
export async function getAllVetClinics(): Promise<VetSearchResult> {
  try {
    const vetsRef = collection(db, 'vets');
    const q = query(vetsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    const vets: VetClinic[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      vets.push({
        id: doc.id,
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        isNamePrivate: data.isNamePrivate || false,
        isPhonePrivate: data.isPhonePrivate || false,
        isEmailPrivate: data.isEmailPrivate || false,
        isAddressPrivate: data.isAddressPrivate || false,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
      });
    });

    return {
      success: true,
      vets
    };
  } catch (error) {
    console.error('Error getting all vet clinics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
