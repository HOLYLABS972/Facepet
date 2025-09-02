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
export async function createPetInFirestore(
  petData: PetData, 
  user: User
): Promise<{ success: boolean; petId?: string; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

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
    if (petData.vetId) {
      const vetData: VetData = {
        name: '',
        phoneNumber: '',
        email: '',
        address: '',
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
      genderId: petData.genderId,
      breedId: petData.breedId,
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
