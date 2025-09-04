import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config';

export interface PetType {
  id: string;
  name: string;
  labels: {
    en: string;
    he: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Get all pet types from Firebase collection (English names only)
 */
export async function getPetTypesFromFirestore(): Promise<PetType[]> {
  try {
    const typesRef = collection(db, 'petTypes');
    const snapshot = await getDocs(typesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PetType));
  } catch (error) {
    console.error('Error fetching pet types:', error);
    return [];
  }
}

/**
 * Get breeds for a specific pet type (English names only)
 */
export async function getBreedsForType(typeName: string): Promise<any[]> {
  try {
    const breedsRef = collection(db, 'breeds');
    const snapshot = await getDocs(breedsRef);
    
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(breed => breed.type === typeName);
  } catch (error) {
    console.error('Error fetching breeds for type:', error);
    return [];
  }
}