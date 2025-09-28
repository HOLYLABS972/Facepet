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
  weight?: string;
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

    // Get breed and gender names from IDs
    const { getBreedName, getGenderName } = await import('./pets');
    const breedName = await getBreedName(petData.breedId);
    const genderName = await getGenderName(petData.genderId);

    // Create pet document directly
    const petDocData = {
      name: petData.name,
      description: petData.description || '',
      imageUrl: petData.imageUrl,
      genderId: petData.genderId,
      gender: genderName, // Add gender name for display
      breedId: petData.breedId,
      breedName: breedName, // Add breed name for display
      birthDate: petData.birthDate || null,
      weight: petData.weight || '',
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
    console.log('Raw pet data from Firebase (consolidated):', {
      id: petDoc.id,
      name: petData.name,
      imageUrl: petData.imageUrl,
      breedName: petData.breedName,
      breedId: petData.breedId,
      gender: petData.gender,
      genderId: petData.genderId,
      type: petData.type,
      weight: petData.weight,
      allData: petData
    });
    
    // Resolve breed name from local data
    let breedName = petData.breedName || petData.breed;
    console.log('Initial breedName from petData:', breedName);
    
    // Convert slug to human-readable text if needed
    if (breedName && !breedName.includes('Unknown') && !breedName.includes('Breed')) {
      try {
        const { convertBreedSlugToName } = await import('@/src/lib/firebase/breed-utils');
        breedName = convertBreedSlugToName(breedName);
        console.log('Converted breedName:', breedName);
      } catch (error) {
        console.error('Error converting breed slug:', error);
      }
    } else if (!breedName && petData.breedId) {
      try {
        // Use local breed data instead of Firebase collection
        const { breedsByType } = await import('@/src/lib/data/breeds');
        const petType = petData.type || 'dog';
        const breeds = breedsByType[petType as keyof typeof breedsByType] || [];
        const breed = breeds.find(b => b.id === String(petData.breedId));
        
        if (breed) {
          breedName = breed.name;
          console.log('Found breed from local data:', breedName);
        } else {
          breedName = 'Unknown Breed';
        }
      } catch (error) {
        console.error('Error getting breed name from local data:', error);
        breedName = 'Unknown Breed';
      }
    }
    
    // Resolve gender name from local data
    let gender = petData.gender;
    console.log('Initial gender from petData:', gender);
    
    // If gender is already saved and not a placeholder, use it
    if (gender && !gender.includes('Unknown') && !gender.includes('Gender')) {
      console.log('Using existing gender from petData:', gender);
    } else if (!gender && petData.genderId) {
      try {
        // Use local gender data instead of Firebase collection
        const genders = [
          { id: 1, name: 'Male', labels: { en: 'Male', he: 'זכר' } },
          { id: 2, name: 'Female', labels: { en: 'Female', he: 'נקבה' } }
        ];
        
        const genderData = genders.find(g => g.id === petData.genderId);
        
        if (genderData) {
          gender = genderData.name;
          console.log('Found gender from local data:', gender);
        } else {
          gender = 'Unknown Gender';
        }
      } catch (error) {
        console.error('Error getting gender name from local data:', error);
        gender = 'Unknown Gender';
      }
    }
    
    // Calculate age from birthDate if not provided
    let age = petData.age;
    if (!age && petData.birthDate) {
      const birthDate = petData.birthDate?.toDate ? petData.birthDate.toDate() : new Date(petData.birthDate);
      const today = new Date();
      
      // If birth date is in the future, set age to "Not born yet"
      if (birthDate > today) {
        age = 'Not born yet';
      } else {
        // Calculate the difference in years
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();
        
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
          const totalDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Convert to years with decimal places
          const ageInYears = totalDays / 365.25;
          
          // Ensure minimum of 0.1 years
          if (ageInYears < 0.1) {
            age = '0.1 years old';
          } else {
            age = `${ageInYears.toFixed(1)} years old`;
          }
        } else {
          age = `${years} years old`;
        }
      }
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
      breed: breedName || 'Unknown Breed', // Changed from breedName to breed
      breedName: breedName || 'Unknown Breed', // Keep both for compatibility
      gender: gender || 'Unknown Gender',
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
      homeAddress: ownerData.address || ownerData.homeAddress, // Try both field names for compatibility
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
