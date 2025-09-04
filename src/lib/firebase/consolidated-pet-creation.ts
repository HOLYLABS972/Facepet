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
  vet?: any;
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
    
    // Debug: Log the raw pet data
    console.log('Raw pet data from Firebase:', {
      id: petDoc.id,
      name: petData.name,
      breedName: petData.breedName,
      breedId: petData.breedId,
      gender: petData.gender,
      genderId: petData.genderId,
      type: petData.type
    });
    
    // Resolve breed name - try multiple approaches
    let breedName = petData.breedName || petData.breed;
    if (!breedName && petData.breedId) {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const breedsRef = collection(db, 'breeds');
        const allBreedsSnapshot = await getDocs(breedsRef);
        
        console.log('All breeds from Firebase:', allBreedsSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
        
        const breedDoc = allBreedsSnapshot.docs.find(doc => {
          const data = doc.data();
          return data.id === petData.breedId || data.id === String(petData.breedId) || doc.id === String(petData.breedId);
        });
        
        if (breedDoc) {
          const breedData = breedDoc.data();
          console.log('Found breed:', breedData);
          breedName = breedData.labels?.en || breedData.name || breedData.en || `Breed ${petData.breedId}`;
          console.log('Resolved breed name:', breedName);
        } else {
          breedName = `Breed ${petData.breedId}`;
        }
      } catch (error) {
        console.error('Error getting breed name:', error);
        breedName = `Breed ${petData.breedId}`;
      }
    }
    
    // Resolve gender name - try multiple approaches
    let gender = petData.gender;
    if (!gender && petData.genderId) {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const gendersRef = collection(db, 'genders');
        const allGendersSnapshot = await getDocs(gendersRef);
        
        console.log('All genders from Firebase:', allGendersSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
        
        const genderDoc = allGendersSnapshot.docs.find(doc => {
          const data = doc.data();
          return data.id === petData.genderId || data.id === String(petData.genderId) || doc.id === String(petData.genderId);
        });
        
        if (genderDoc) {
          const genderData = genderDoc.data();
          console.log('Found gender:', genderData);
          gender = genderData.labels?.en || genderData.name || genderData.en || `Gender ${petData.genderId}`;
          console.log('Resolved gender name:', gender);
        } else {
          gender = `Gender ${petData.genderId}`;
        }
      } catch (error) {
        console.error('Error getting gender name:', error);
        gender = `Gender ${petData.genderId}`;
      }
    }
    
    // Calculate age from birthDate if not provided
    let age = petData.age;
    if (!age && petData.birthDate) {
      const birthDate = petData.birthDate?.toDate ? petData.birthDate.toDate() : new Date(petData.birthDate);
      const today = new Date();
      const ageInYears = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      age = ageInYears.toString();
    }
    
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
      breedName: breedName || `Breed ${petData.breedId}`,
      gender: gender || `Gender ${petData.genderId}`,
      age: age,
      type: petData.type || 'Dog',
      weight: petData.weight,
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
      fullName: ownerData.displayName,
      phone: ownerData.phone,
      phoneNumber: ownerData.phone,
      homeAddress: ownerData.homeAddress,
      profileImage: ownerData.profileImage,
      language: ownerData.language,
      acceptCookies: ownerData.acceptCookies,
      role: ownerData.role,
      // Convert Firebase Timestamps to Date objects
      createdAt: ownerData.createdAt?.toDate ? ownerData.createdAt.toDate() : ownerData.createdAt,
      updatedAt: ownerData.updatedAt?.toDate ? ownerData.updatedAt.toDate() : ownerData.updatedAt
    };
    
    // Get vet data if vetId exists
    let vet = null;
    if (pet.vetId) {
      try {
        const vetDoc = await getDoc(doc(db, 'vets', pet.vetId));
        if (vetDoc.exists()) {
          const vetData = vetDoc.data();
          vet = {
            id: vetDoc.id,
            name: vetData.name,
            phoneNumber: vetData.phoneNumber,
            email: vetData.email,
            address: vetData.address
          };
        }
      } catch (error) {
        console.error('Error getting vet data:', error);
      }
    }
    
    return { success: true, pet, owner, vet };
  } catch (error: any) {
    console.error('Get pet with owner error:', error);
    return { success: false, error: 'Failed to get pet with owner' };
  }
}
