import { db } from './config';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface SimplePetData {
  name: string;
  type: string;
  breedName: string;
  imageUrl: string;
  description?: string;
  age?: string;
  gender?: string;
}

export interface SimplePet {
  id: string;
  name: string;
  type: string;
  breedName: string;
  imageUrl: string;
  description?: string;
  age?: string;
  gender?: string;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new pet in Firestore (simplified version)
 */
export async function createPetInFirestore(
  petData: SimplePetData, 
  user: User
): Promise<{ success: boolean; petId?: string; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    const petDocData = {
      name: petData.name,
      type: petData.type,
      breedName: petData.breedName,
      imageUrl: petData.imageUrl,
      description: petData.description || '',
      age: petData.age || '',
      gender: petData.gender || '',
      userEmail: user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const petRef = await addDoc(collection(db, 'pets'), petDocData);

    return { 
      success: true, 
      petId: petRef.id 
    };
  } catch (error) {
    console.error('Error creating pet:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update a pet in Firestore
 */
export async function updatePetInFirestore(
  petId: string,
  petData: Partial<SimplePetData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const petRef = doc(db, 'pets', petId);
    
    const updateData = {
      ...petData,
      updatedAt: new Date()
    };

    await updateDoc(petRef, updateData);

    return { success: true };
  } catch (error) {
    console.error('Error updating pet:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete a pet from Firestore
 */
export async function deletePetFromFirestore(
  petId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const petRef = doc(db, 'pets', petId);
    await deleteDoc(petRef);

    return { success: true };
  } catch (error) {
    console.error('Error deleting pet:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get a pet by ID
 */
export async function getPetById(
  petId: string
): Promise<{ success: boolean; pet?: SimplePet; error?: string }> {
  try {
    const petRef = doc(db, 'pets', petId);
    const petSnap = await getDoc(petRef);

    if (petSnap.exists()) {
      const data = petSnap.data();
      const pet: SimplePet = {
        id: petSnap.id,
        name: data.name,
        type: data.type,
        breedName: data.breedName,
        imageUrl: data.imageUrl,
        description: data.description,
        age: data.age,
        gender: data.gender,
        userEmail: data.userEmail,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };

      return { success: true, pet };
    } else {
      return { success: false, error: 'Pet not found' };
    }
  } catch (error) {
    console.error('Error getting pet:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
