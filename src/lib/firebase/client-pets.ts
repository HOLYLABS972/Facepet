'use client';

import { createPetInFirestore } from './pets';
import { useAuth } from '@/src/contexts/AuthContext';

export interface NewPetData {
  id: string;
  imageUrl: string;
  petName: string;
  type: string;
  breed: string;
  gender: string;
  birthDate: string | null;
  notes: string;
  // All pet information is always public
  // Owner information
  ownerFullName: string;
  ownerPhoneNumber: string;
  ownerEmailAddress: string;
  ownerHomeAddress: string;
  // Owner privacy settings - name is always public
  isOwnerPhonePrivate?: boolean;
  isOwnerEmailPrivate?: boolean;
  isOwnerAddressPrivate?: boolean;
  // Vet information
  vetName: string;
  vetPhoneNumber: string;
  vetEmailAddress: string;
  vetAddress: string;
  // Vet privacy settings - all vet info can be private
  isVetNamePrivate?: boolean;
  isVetPhonePrivate?: boolean;
  isVetEmailPrivate?: boolean;
  isVetAddressPrivate?: boolean;
}

/**
 * Create new pet (Firebase client-side version - matches original interface)
 */
export async function createNewPet(
  petId: string, 
  petData: NewPetData,
  user: any
): Promise<{ success: boolean; petId?: string; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    // Transform the form data to match our PetData interface
    const transformedPetData = {
      name: petData.petName || '',
      description: '',
      imageUrl: petData.imageUrl || '',
      gender: petData.gender || '',
      breed: petData.breed || '',
      type: petData.type || '',
      birthDate: petData.birthDate ? new Date(petData.birthDate).toISOString() : undefined,
      notes: petData.notes || '',
      ownerName: petData.ownerFullName || '',
      ownerPhone: petData.ownerPhoneNumber || '',
      ownerEmail: petData.ownerEmailAddress || '',
      ownerAddress: petData.ownerHomeAddress || '',
      vetId: petData.vetName ? 'vet-id' : undefined,
      vetName: petData.vetName || '',
      vetPhoneNumber: petData.vetPhoneNumber || '',
      vetEmailAddress: petData.vetEmailAddress || '',
      vetAddress: petData.vetAddress || ''
    };

    // Use Firebase to create the pet
    const result = await createPetInFirestore(transformedPetData, user);

    if (result.success) {
      // Update user profile with owner information
      try {
        const { doc, updateDoc, collection, query, where, getDocs } = await import('firebase/firestore');
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('email', '==', user.email));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(userDoc.ref, {
            displayName: petData.ownerFullName || user.displayName,
            phone: petData.ownerPhoneNumber || user.phone,
            homeAddress: petData.ownerHomeAddress || '',
            updatedAt: new Date()
          });
        }
      } catch (updateError) {
        console.warn('Failed to update user profile:', updateError);
        // Don't fail the entire operation for this
      }

      return { success: true, petId: result.petId };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error('Create new pet error:', error);
    return { success: false, error: 'Failed to create pet' };
  }
}
