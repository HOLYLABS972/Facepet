import { db } from './config';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface SimplePetData {
  name: string;
  type: string;
  breedName: string;
  breedId?: string;
  imageUrl: string;
  description?: string;
  age?: string;
  gender?: string;
  updatedAt?: Date;
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
 * Get breed name from breedId
 */
import { getBreedNameFromId } from './breed-utils';

async function getBreedName(breedId: string): Promise<string> {
  return getBreedNameFromId(breedId);
}

/**
 * Get gender name from genderId
 */
async function getGenderName(genderId: number): Promise<string> {
  try {
    // Import the genders data
    const gendersData = await import('../../../utils/database/seeds/genders.json');
    const gender = gendersData.default.find((g: any) => g.id === genderId);
    return gender ? gender.en : `Gender ${genderId}`;
  } catch (error) {
    console.error('Error getting gender name:', error);
    return `Gender ${genderId}`;
  }
}

/**
 * Calculate age from birthDate
 */
function calculateAge(birthDate: string): string {
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age === 0) {
      const monthAge = today.getMonth() - birth.getMonth();
      if (monthAge <= 1) {
        const dayAge = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
        return `${dayAge} days old`;
      }
      return `${monthAge} months old`;
    }
    
    return `${age} years old`;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 'Unknown age';
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
    
    // If breedName is being updated and we have breedId, resolve the breed name
    let updateData = { ...petData };
    
    // If breedName is provided as a string, use it directly
    if (petData.breedName && typeof petData.breedName === 'string') {
      updateData.breedName = petData.breedName;
    }
    // If breedId is provided but no breedName, resolve the breed name
    else if (petData.breedId && !petData.breedName) {
      updateData.breedName = await getBreedName(petData.breedId);
    }
    
    updateData.updatedAt = new Date();

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
      
      // Resolve breed name if breedId is provided instead of breedName
      let breedName = data.breedName;
      if (!breedName && data.breedId) {
        breedName = await getBreedName(data.breedId);
      }
      
      // Resolve gender name if genderId is provided instead of gender
      let gender = data.gender;
      if (!gender && data.genderId) {
        gender = await getGenderName(data.genderId);
      }
      
      // Calculate age from birthDate if age is not provided
      let age = data.age;
      if (!age && data.birthDate) {
        age = calculateAge(data.birthDate);
      }
      
      // Debug date conversion
      const createdAtDate = data.createdAt?.toDate() || new Date();
      const updatedAtDate = data.updatedAt?.toDate() || new Date();
      
      console.log('Pet data from Firestore:', {
        id: petSnap.id,
        name: data.name,
        breedName: breedName,
        gender: gender,
        age: age,
        createdAt: data.createdAt,
        createdAtDate: createdAtDate,
        updatedAt: data.updatedAt,
        updatedAtDate: updatedAtDate
      });

      const pet: SimplePet = {
        id: petSnap.id,
        name: data.name,
        type: data.type || 'Dog', // Default to Dog if type is not set
        breedName: breedName || 'Unknown Breed',
        imageUrl: data.imageUrl,
        description: data.description,
        age: age,
        gender: gender,
        userEmail: data.userEmail,
        createdAt: createdAtDate,
        updatedAt: updatedAtDate
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
