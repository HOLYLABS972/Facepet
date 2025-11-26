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
  weight?: string;
  notes?: string;
  updatedAt?: Date;
}

export interface SimplePet {
  id: string;
  name: string;
  type: string;
  breedName: string;
  breedId?: string;
  imageUrl: string;
  description?: string;
  age?: string;
  gender?: string;
  weight?: string;
  notes?: string;
  birthDate?: string;
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

    const petDocData: any = {
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
    
    // Include breedId if provided
    if (petData.breedId) {
      // Convert breedId to number if it's a string representation of a number
      const breedIdNum = typeof petData.breedId === 'string' ? parseInt(petData.breedId, 10) : petData.breedId;
      if (!isNaN(breedIdNum as number)) {
        petDocData.breedId = breedIdNum;
      } else {
        // If it's not a number (e.g., 'dog-1'), save as string
        petDocData.breedId = petData.breedId;
      }
    }

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
import { getBreedNameFromId, getBreedIdFromName } from './breed-utils';

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
    
    // If birth date is in the future, return "Not born yet"
    if (birth > today) {
      return 'Not born yet';
    }
    
    // Calculate the difference in years
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    
    // Adjust if the day hasn't occurred yet this month
    if (days < 0) {
      months--;
      // Get the last day of the previous month
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    // Adjust if the month hasn't occurred yet this year
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // If less than a year old, show as decimal years (minimum 0.1 years)
    if (years === 0) {
      // Calculate total days
      const totalDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      
      // Convert to years with decimal places
      const ageInYears = totalDays / 365.25;
      
      // Ensure minimum of 0.1 years
      if (ageInYears < 0.1) {
        return '0.1 years old';
      } else {
        return `${ageInYears.toFixed(1)} years old`;
      }
    }
    
    return `${years} years old`;
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
    
    // If breedId is provided as a string, convert it to number
    if (petData.breedId && typeof petData.breedId === 'string') {
      const breedIdNum = parseInt(petData.breedId, 10);
      if (!isNaN(breedIdNum)) {
        updateData.breedId = breedIdNum;
      }
    }
    
    // If breedName is provided as a string, use it directly
    if (petData.breedName && typeof petData.breedName === 'string') {
      updateData.breedName = petData.breedName;
    }
    // If breedId is provided but no breedName, resolve the breed name
    else if (updateData.breedId && !petData.breedName) {
      updateData.breedName = await getBreedName(updateData.breedId);
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
      
      // Resolve breed name and ID - check both breed and breedName fields
      let breedName = data.breedName || data.breed;
      let breedId = data.breedId;
      
      if (!breedName && data.breedId) {
        breedName = await getBreedName(data.breedId);
      } else if (breedName && !breedId) {
        // If we have breed name but no ID, find the ID
        breedId = getBreedIdFromName(breedName);
      }
      
      // Convert breed slug to human-readable text if needed
      if (breedName && !breedName.includes('Unknown') && !breedName.includes('Breed')) {
        try {
          const { convertBreedSlugToName } = await import('@/src/lib/firebase/breed-utils');
          breedName = convertBreedSlugToName(breedName);
        } catch (error) {
          console.error('Error converting breed slug:', error);
        }
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
        breedId: breedId,
        imageUrl: data.imageUrl,
        description: data.description,
        age: age,
        gender: gender,
        weight: data.weight,
        notes: data.notes,
        birthDate: data.birthDate ? (typeof data.birthDate === 'string' ? data.birthDate : data.birthDate.toISOString()) : undefined,
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
