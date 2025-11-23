import { db } from './config';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface PetData {
  name: string;
  description?: string;
  imageUrl: string;
  type: string;
  gender: string;
  breed: string;
  birthDate?: string;
  weight?: string;
  notes?: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerAddress: string;
  vetId?: string;
  // Vet data for creation
  vetName?: string;
  vetPhoneNumber?: string;
  vetEmailAddress?: string;
  vetAddress?: string;
}

export interface OwnerData {
  fullName: string;
  phoneNumber: string;
  email: string;
  homeAddress: string;
  isPhonePrivate: boolean;
  isEmailPrivate: boolean;
  isAddressPrivate: boolean;
}

export interface VetData {
  name?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  isPhonePrivate?: boolean;
  isEmailPrivate?: boolean;
  isAddressPrivate?: boolean;
}

export interface Pet {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  genderId: number;
  breedId: number;
  birthDate?: string;
  weight?: string;
  notes?: string;
  userEmail: string;
  ownerId: string;
  vetId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  genderName?: string;
  breedName?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerAddress?: string;
}

/**
 * Create a new pet in Firestore
 */
/**
 * Get breed name from breedId with locale support
 */
async function getBreedName(breedId: number, locale: 'en' | 'he' = 'en'): Promise<string> {
  try {
    console.log('Looking for breed with ID:', breedId, 'locale:', locale);
    
    // First try to find in comprehensive breeds data from breeds.json
    const { breedsData } = await import('../data/comprehensive-breeds');
    const breed = breedsData.find(b => b.id === breedId);
    if (breed) {
      const breedName = locale === 'he' ? breed.he : breed.en;
      console.log('Found breed in comprehensive data:', breedName);
      return breedName;
    }
    
    // Fallback to Firebase breeds collection
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const breedsRef = collection(db, 'breeds');
    const q = query(breedsRef, where('id', '==', breedId));
    const querySnapshot = await getDocs(q);
    
    console.log('Breed query results:', querySnapshot.docs.length, 'documents found');
    
    if (!querySnapshot.empty) {
      const breedDoc = querySnapshot.docs[0];
      const breedData = breedDoc.data();
      console.log('Found breed data:', breedData);
      const breedName = locale === 'he' ? (breedData.labels?.he || breedData.he) : (breedData.labels?.en || breedData.en || breedData.name);
      console.log('Returning breed name:', breedName);
      return breedName || 'Unknown Breed';
    }
    
    // If not found by ID, try to get all breeds to see what's available
    console.log('Breed not found by ID, checking all breeds...');
    const allBreedsSnapshot = await getDocs(breedsRef);
    console.log('All breeds in collection:', allBreedsSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
    
    return locale === 'he' ? 'גזע לא ידוע' : 'Unknown Breed';
  } catch (error) {
    console.error('Error getting breed name:', error);
    return locale === 'he' ? 'גזע לא ידוע' : 'Unknown Breed';
  }
}

async function getGenderName(genderId: number): Promise<string> {
  try {
    console.log('Looking for gender with ID:', genderId);
    // Query the genders collection from Firebase
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const gendersRef = collection(db, 'genders');
    const q = query(gendersRef, where('id', '==', genderId));
    const querySnapshot = await getDocs(q);
    
    console.log('Gender query results:', querySnapshot.docs.length, 'documents found');
    
    if (!querySnapshot.empty) {
      const genderDoc = querySnapshot.docs[0];
      const genderData = genderDoc.data();
      console.log('Found gender data:', genderData);
      const genderName = genderData.labels?.en || genderData.name || 'Unknown Gender';
      console.log('Returning gender name:', genderName);
      return genderName;
    }
    
    // If not found by ID, try to get all genders to see what's available
    console.log('Gender not found by ID, checking all genders...');
    const allGendersSnapshot = await getDocs(gendersRef);
    console.log('All genders in collection:', allGendersSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
    
    return 'Unknown Gender';
  } catch (error) {
    console.error('Error getting gender name:', error);
    return 'Unknown Gender';
  }
}

// Export the functions
export { getBreedName, getGenderName };

export async function createPetInFirestore(
  petData: PetData, 
  user: User,
  petId?: string
): Promise<{ success: boolean; petId?: string; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    // Use the string values directly (no need to convert from IDs)
    const breedName = petData.breed || '';
    const genderName = petData.gender || '';
    const typeName = petData.type || '';

    // Update user profile with owner information if provided
    if (petData.ownerName || petData.ownerPhone || petData.ownerEmail || petData.ownerAddress) {
      try {
        const { updateUserInFirestore } = await import('./users');
        const updateData: any = {};
        
        if (petData.ownerName) updateData.displayName = petData.ownerName;
        if (petData.ownerPhone) updateData.phone = petData.ownerPhone;
        if (petData.ownerAddress) updateData.address = petData.ownerAddress;
        
        await updateUserInFirestore(user.uid, updateData);
        console.log('Updated user profile with owner information');
      } catch (error) {
        console.warn('Failed to update user profile with owner information:', error);
        // Don't fail the entire operation for this
      }
    }

    // Handle vet - use existing vetId if provided, otherwise create new vet
    let vetRef = null;
    if (petData.vetId) {
      // Use existing vet ID
      vetRef = { id: petData.vetId };
    } else if (petData.vetName && petData.vetName.trim() !== '') {
      // Create new vet document if vet data is provided but no existing vetId
      const vetData: VetData = {
        name: petData.vetName,
        phoneNumber: petData.vetPhoneNumber || '',
        email: petData.vetEmailAddress || '',
        address: petData.vetAddress || '',
        isPhonePrivate: false,
        isEmailPrivate: false,
        isAddressPrivate: false
      };

      vetRef = await addDoc(collection(db, 'vets'), {
        ...vetData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create pet document - no need for separate owner, user is the owner
    const petDocData = {
      name: petData.name,
      description: petData.description || '',
      imageUrl: petData.imageUrl,
      type: typeName,
      gender: genderName,
      breed: breedName,
      breedName: breedName, // Also save as breedName for consistency
      birthDate: petData.birthDate || null,
      weight: petData.weight || '',
      notes: petData.notes || '',
      userEmail: user.email, // Direct reference to user (no ownerId needed)
      vetId: vetRef?.id || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // If petId is provided, use setDoc to create with that specific ID
    // Otherwise, use addDoc to generate a new ID
    let finalPetId: string;
    if (petId) {
      const petDocRef = doc(db, 'pets', petId);
      await setDoc(petDocRef, petDocData);
      finalPetId = petId;
    } else {
      const petRef = await addDoc(collection(db, 'pets'), petDocData);
      finalPetId = petRef.id;
    }

    // Update user audiences based on new pet
    try {
      const { updateUserAudiencesOnPetChange } = await import('./audience-assignment');
      await updateUserAudiencesOnPetChange(user.email);
    } catch (audienceError) {
      console.warn('Failed to update audiences on pet creation:', audienceError);
    }

    return { success: true, petId: finalPetId };
  } catch (error: any) {
    console.error('Create pet error:', error);
    return { success: false, error: 'Failed to create pet' };
  }
}

/**
 * Get a pet by ID from Firestore
 */
export async function getPetByIdFromFirestore(petId: string): Promise<{ success: boolean; pet?: Pet; error?: string }> {
  try {
    const petRef = doc(db, 'pets', petId);
    const petSnap = await getDoc(petRef);

    if (!petSnap.exists()) {
      return { success: false, error: 'Pet not found' };
    }

    const petData = petSnap.data();
    const pet: Pet = {
      id: petSnap.id,
      name: petData.name,
      description: petData.description,
      imageUrl: petData.imageUrl,
      genderId: petData.genderId,
      breedId: petData.breedId,
      birthDate: petData.birthDate,
      weight: petData.weight,
      notes: petData.notes,
      userEmail: petData.userEmail,
      ownerId: petData.ownerId,
      vetId: petData.vetId,
      createdAt: petData.createdAt?.toDate() || new Date(),
      updatedAt: petData.updatedAt?.toDate() || new Date()
    };

    return { success: true, pet };
  } catch (error: any) {
    console.error('Get pet by ID error:', error);
    return { success: false, error: 'Failed to get pet' };
  }
}
