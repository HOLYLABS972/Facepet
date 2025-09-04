import { db } from './config';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface PetData {
  name: string;
  description?: string;
  imageUrl: string;
  genderId: number;
  breedId: number;
  birthDate?: string;
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
 * Get breed name from breedId
 */
async function getBreedName(breedId: number): Promise<string> {
  try {
    // Query the breeds collection from Firebase
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const breedsRef = collection(db, 'breeds');
    const q = query(breedsRef, where('id', '==', breedId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const breedDoc = querySnapshot.docs[0];
      const breedData = breedDoc.data();
      return breedData.labels?.en || breedData.name || `Breed ${breedId}`;
    }
    
    return `Breed ${breedId}`;
  } catch (error) {
    console.error('Error getting breed name:', error);
    return `Breed ${breedId}`;
  }
}

async function getGenderName(genderId: number): Promise<string> {
  try {
    // Query the genders collection from Firebase
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const gendersRef = collection(db, 'genders');
    const q = query(gendersRef, where('id', '==', genderId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const genderDoc = querySnapshot.docs[0];
      const genderData = genderDoc.data();
      return genderData.labels?.en || genderData.name || `Gender ${genderId}`;
    }
    
    return `Gender ${genderId}`;
  } catch (error) {
    console.error('Error getting gender name:', error);
    return `Gender ${genderId}`;
  }
}

// Export the functions
export { getBreedName, getGenderName };

export async function createPetInFirestore(
  petData: PetData, 
  user: User
): Promise<{ success: boolean; petId?: string; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get breed name from breedId
    const breedName = await getBreedName(petData.breedId);

    // Create owner document first
    const ownerData: OwnerData = {
      fullName: petData.ownerName,
      phoneNumber: petData.ownerPhone,
      email: petData.ownerEmail,
      homeAddress: petData.ownerAddress,
      isPhonePrivate: false,
      isEmailPrivate: false,
      isAddressPrivate: false
    };

    const ownerRef = await addDoc(collection(db, 'owners'), {
      ...ownerData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create vet document if vet data is provided
    let vetRef = null;
    if (petData.vetName && petData.vetName.trim() !== '') {
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

    // Create pet document
    const petDocData = {
      name: petData.name,
      description: petData.description || '',
      imageUrl: petData.imageUrl,
      type: 'Dog', // Default type for display compatibility
      genderId: petData.genderId,
      breedId: petData.breedId,
      breedName: breedName, // Add breed name for display
      birthDate: petData.birthDate || null,
      notes: petData.notes || '',
      userEmail: user.email,
      ownerId: ownerRef.id,
      vetId: vetRef?.id || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const petRef = await addDoc(collection(db, 'pets'), petDocData);

    return { success: true, petId: petRef.id };
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
