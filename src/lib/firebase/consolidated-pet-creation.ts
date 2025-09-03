// Simplified pet creation using consolidated users collection

import { User } from 'firebase/auth';
import { db } from '@/src/lib/firebase/config';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

export interface SimplifiedPetData {
  name: string;
  description?: string;
  imageUrl: string;
  genderId: number;
  breedId: number;
  birthDate?: Date;
  notes?: string;
  vetId?: string;
}

/**
 * Create a new pet using consolidated users collection
 * No need to create separate owner - user is the owner
 */
export async function createPetWithConsolidatedUser(
  petData: SimplifiedPetData,
  user: User
): Promise<{ success: boolean; petId?: string; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    // Create pet document directly
    const petDocData = {
      name: petData.name,
      description: petData.description || '',
      imageUrl: petData.imageUrl,
      genderId: petData.genderId,
      breedId: petData.breedId,
      birthDate: petData.birthDate || null,
      notes: petData.notes || '',
      userEmail: user.email, // Direct reference to user
      vetId: petData.vetId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const petRef = await addDoc(collection(db, 'pets'), petDocData);

    // Optionally update user document to track pet count
    try {
      const userQuery = await import('firebase/firestore').then(firestore => 
        firestore.query(
          firestore.collection(db, 'users'),
          firestore.where('email', '==', user.email)
        )
      );
      
      const userSnapshot = await import('firebase/firestore').then(firestore => 
        firestore.getDocs(userQuery)
      );
      
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        const currentPets = userData.pets || [];
        
        await updateDoc(userDoc.ref, {
          pets: [...currentPets, petRef.id],
          updatedAt: new Date()
        });
      }
    } catch (userUpdateError) {
      console.warn('Failed to update user pets array:', userUpdateError);
      // Don't fail the entire operation for this
    }

    return { success: true, petId: petRef.id };
  } catch (error: any) {
    console.error('Create pet error:', error);
    return { success: false, error: 'Failed to create pet' };
  }
}

/**
 * Get pet with owner information from consolidated users collection
 */
export async function getPetWithConsolidatedOwner(petId: string): Promise<{
  success: boolean;
  pet?: any;
  owner?: any;
  error?: string;
}> {
  try {
    const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');
    
    // Get pet
    const petDoc = await getDoc(doc(db, 'pets', petId));
    if (!petDoc.exists()) {
      return { success: false, error: 'Pet not found' };
    }
    
    const petData = petDoc.data();
    const pet = { 
      id: petDoc.id, 
      name: petData.name,
      description: petData.description,
      imageUrl: petData.imageUrl,
      genderId: petData.genderId,
      breedId: petData.breedId,
      birthDate: petData.birthDate?.toDate ? petData.birthDate.toDate() : petData.birthDate,
      notes: petData.notes,
      userEmail: petData.userEmail,
      vetId: petData.vetId,
      breedName: petData.breedName,
      gender: petData.gender,
      age: petData.age,
      type: petData.type,
      // Convert Firebase Timestamps to Date objects
      createdAt: petData.createdAt?.toDate ? petData.createdAt.toDate() : petData.createdAt,
      updatedAt: petData.updatedAt?.toDate ? petData.updatedAt.toDate() : petData.updatedAt
    };
    
    // Get owner from users collection
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', pet.userEmail)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      return { success: false, error: 'Owner not found' };
    }
    
    const ownerDoc = usersSnapshot.docs[0];
    const ownerData = ownerDoc.data();
    const owner = { 
      id: ownerDoc.id, 
      uid: ownerData.uid,
      email: ownerData.email,
      displayName: ownerData.displayName,
      phone: ownerData.phone,
      profileImage: ownerData.profileImage,
      language: ownerData.language,
      acceptCookies: ownerData.acceptCookies,
      role: ownerData.role,
      // Convert Firebase Timestamps to Date objects
      createdAt: ownerData.createdAt?.toDate ? ownerData.createdAt.toDate() : ownerData.createdAt,
      updatedAt: ownerData.updatedAt?.toDate ? ownerData.updatedAt.toDate() : ownerData.updatedAt
    };
    
    return { success: true, pet, owner };
  } catch (error: any) {
    console.error('Get pet with owner error:', error);
    return { success: false, error: 'Failed to get pet with owner' };
  }
}
