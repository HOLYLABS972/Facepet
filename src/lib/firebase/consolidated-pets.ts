// Updated Pet structure without ownerId reference
// Pets now only reference userEmail (which points to consolidated users collection)

export interface ConsolidatedPet {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  genderId: number;
  breedId: number;
  birthDate?: Date;
  notes?: string;
  
  // Only reference userEmail (no more ownerId)
  userEmail: string; // Points to consolidated users collection
  
  // Optional vet reference
  vetId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Pet creation data (simplified)
export interface PetCreationData {
  name: string;
  description?: string;
  imageUrl: string;
  genderId: number;
  breedId: number;
  birthDate?: Date;
  notes?: string;
  vetId?: string;
}

// Helper function to create pet with user context
export async function createConsolidatedPet(
  petData: PetCreationData,
  userEmail: string
): Promise<{ success: boolean; petId?: string; error?: string }> {
  try {
    const { db } = await import('@/src/lib/firebase/config');
    const { collection, addDoc } = await import('firebase/firestore');
    
    // Get breed and gender names from IDs
    const { getBreedName, getGenderName } = await import('./pets');
    const breedName = await getBreedName(petData.breedId);
    const genderName = await getGenderName(petData.genderId);
    
    const petDocData = {
      ...petData,
      gender: genderName, // Add gender name for display
      breedName: breedName, // Add breed name for display
      userEmail,
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

// Helper function to get pet with owner info
export async function getPetWithOwner(petId: string): Promise<{
  success: boolean;
  pet?: ConsolidatedPet;
  owner?: any;
  error?: string;
}> {
  try {
    const { db } = await import('@/src/lib/firebase/config');
    const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');
    
    // Get pet
    const petDoc = await getDoc(doc(db, 'pets', petId));
    if (!petDoc.exists()) {
      return { success: false, error: 'Pet not found' };
    }
    
    const pet = { id: petDoc.id, ...petDoc.data() } as ConsolidatedPet;
    
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
    const owner = { id: ownerDoc.id, ...ownerDoc.data() };
    
    return { success: true, pet, owner };
  } catch (error: any) {
    console.error('Get pet with owner error:', error);
    return { success: false, error: 'Failed to get pet with owner' };
  }
}
