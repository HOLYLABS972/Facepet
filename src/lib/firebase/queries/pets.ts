'use server';

import { adminDb } from '../admin';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, orderBy } from 'firebase-admin/firestore';

export interface Pet {
  id: string;
  name: string;
  imageUrl: string;
  genderId: number;
  breedId: number;
  birthDate?: Date;
  notes?: string;
  userId: string;
  ownerId: string;
  vetId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Owner {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  homeAddress: string;
  isPhonePrivate: boolean;
  isEmailPrivate: boolean;
  isAddressPrivate: boolean;
}

export interface Vet {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  isNamePrivate: boolean;
  isPhonePrivate: boolean;
  isEmailPrivate: boolean;
  isAddressPrivate: boolean;
}

export interface Gender {
  id: number;
  en: string;
  he: string;
}

export interface Breed {
  id: number;
  en: string;
  he: string;
}

export interface PetWithDetails {
  id: string;
  name: string;
  imageUrl: string;
  birthDate?: Date;
  notes?: string;
  userId: string;
  gender: Gender;
  breed: Breed;
  owner: Owner;
  vet?: Vet;
}

/**
 * Fetches pet details by ID with all related data.
 */
export const getPetDetailsById = async (petId: string): Promise<PetWithDetails | null> => {
  try {
    // Get pet document
    const petDoc = await getDoc(doc(adminDb, 'pets', petId));
    if (!petDoc.exists) {
      return null;
    }

    const petData = petDoc.data() as Pet;

    // Get related data in parallel
    const [genderDoc, breedDoc, ownerDoc, vetDoc] = await Promise.all([
      getDoc(doc(adminDb, 'genders', petData.genderId.toString())),
      getDoc(doc(adminDb, 'breeds', petData.breedId.toString())),
      getDoc(doc(adminDb, 'owners', petData.ownerId)),
      petData.vetId ? getDoc(doc(adminDb, 'vets', petData.vetId)) : Promise.resolve(null)
    ]);

    // Build the result
    const result: PetWithDetails = {
      id: petDoc.id,
      name: petData.name,
      imageUrl: petData.imageUrl,
      birthDate: petData.birthDate,
      notes: petData.notes,
      userId: petData.userId,
      gender: genderDoc.exists ? { id: genderDoc.id, ...genderDoc.data() } as Gender : null,
      breed: breedDoc.exists ? { id: breedDoc.id, ...breedDoc.data() } as Breed : null,
      owner: ownerDoc.exists ? { id: ownerDoc.id, ...ownerDoc.data() } as Owner : null,
      vet: vetDoc?.exists ? { id: vetDoc.id, ...vetDoc.data() } as Vet : undefined
    };

    return result;
  } catch (error) {
    console.error('Error fetching pet details:', error);
    return null;
  }
};

/**
 * Creates a new pet.
 */
export const createPet = async (petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pet> => {
  const now = new Date();
  const newPet = {
    ...petData,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(adminDb, 'pets'), newPet);
  
  return {
    id: docRef.id,
    ...newPet
  };
};

/**
 * Updates pet details.
 */
export const updatePet = async (petId: string, updates: Partial<Pet>): Promise<void> => {
  const docRef = doc(adminDb, 'pets', petId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date()
  });
};

/**
 * Gets all pets for a user.
 */
export const getPetsByUserId = async (userId: string): Promise<Pet[]> => {
  const q = query(collection(adminDb, 'pets'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Pet));
};

/**
 * Gets all genders.
 */
export const getAllGenders = async (): Promise<Gender[]> => {
  const querySnapshot = await getDocs(collection(adminDb, 'genders'));
  
  return querySnapshot.docs.map(doc => ({
    id: parseInt(doc.id),
    ...doc.data()
  } as Gender));
};

/**
 * Gets all breeds.
 */
export const getAllBreeds = async (): Promise<Breed[]> => {
  const querySnapshot = await getDocs(collection(adminDb, 'breeds'));
  
  return querySnapshot.docs.map(doc => ({
    id: parseInt(doc.id),
    ...doc.data()
  } as Breed));
};
