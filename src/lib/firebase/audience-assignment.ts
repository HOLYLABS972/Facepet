import { db } from './config';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAudiences } from './queries/promo';
import { Audience } from '@/types/promo';

/**
 * Extract city from address string
 * Examples:
 * - "Tel Aviv, Israel" -> "Tel Aviv"
 * - "Jerusalem" -> "Jerusalem"
 * - "123 Main St, Tel Aviv, Israel" -> "Tel Aviv"
 */
function extractCityFromAddress(address: string): string | null {
  if (!address || address.trim() === '') {
    return null;
  }

  // Split by comma and get the city (usually second to last or last part)
  const parts = address.split(',').map(p => p.trim());
  
  // If only one part, return it
  if (parts.length === 1) {
    return parts[0];
  }
  
  // If multiple parts, city is usually the second to last (before country)
  // or the last if it's not a common country name
  const commonCountries = ['israel', 'ישראל', 'usa', 'united states'];
  const lastPart = parts[parts.length - 1].toLowerCase();
  
  if (commonCountries.includes(lastPart)) {
    // City is second to last
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  } else {
    // City might be the last part
    return parts[parts.length - 1];
  }
}

/**
 * Get user's pet types from their pets
 */
async function getUserPetTypes(userEmail: string): Promise<string[]> {
  try {
    const petsQuery = query(
      collection(db, 'pets'),
      where('userEmail', '==', userEmail)
    );
    const petsSnapshot = await getDocs(petsQuery);
    
    const petTypes = new Set<string>();
    petsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.type) {
        petTypes.add(data.type.toLowerCase());
      }
      if (data.breedName) {
        // Also add breed name as it might be in target criteria
        petTypes.add(data.breedName.toLowerCase());
      }
    });
    
    return Array.from(petTypes);
  } catch (error) {
    console.error('Error fetching user pet types:', error);
    return [];
  }
}

/**
 * Match user data with audience target criteria
 */
function matchAudiences(
  audiences: Audience[],
  city: string | null,
  petTypes: string[]
): string[] {
  const matchedAudienceIds: string[] = [];
  
  audiences.forEach(audience => {
    if (!audience.isActive) {
      return; // Skip inactive audiences
    }
    
    // Check if any target criteria matches
    const matches = audience.targetCriteria.some(criteria => {
      const lowerCriteria = criteria.toLowerCase();
      
      // Match city
      if (city && lowerCriteria.includes(city.toLowerCase())) {
        return true;
      }
      
      // Match pet types
      if (petTypes.some(petType => lowerCriteria.includes(petType))) {
        return true;
      }
      
      // Match exact city name
      if (city && lowerCriteria === city.toLowerCase()) {
        return true;
      }
      
      return false;
    });
    
    if (matches) {
      matchedAudienceIds.push(audience.id);
    }
  });
  
  return matchedAudienceIds;
}

/**
 * Automatically assign audiences to a user based on location and pet types
 */
export async function assignAudiencesToUser(
  userEmail: string,
  address?: string
): Promise<{ success: boolean; assignedAudiences?: string[]; error?: string }> {
  try {
    // Get user document by email
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', userEmail)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      return { success: false, error: 'User not found' };
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Get address from parameter or user data
    const userAddress = address || userData.address || '';
    
    // Extract city from address
    const city = extractCityFromAddress(userAddress);
    
    // Get user's pet types
    const petTypes = await getUserPetTypes(userEmail);
    
    // Get all active audiences
    const audiences = await getAudiences();
    
    // Match audiences
    const matchedAudienceIds = matchAudiences(audiences, city, petTypes);
    
    // Update user document with audience IDs
    if (matchedAudienceIds.length > 0) {
      await updateDoc(userDoc.ref, {
        audienceIds: matchedAudienceIds,
        updatedAt: new Date()
      });
      
      console.log(`Assigned ${matchedAudienceIds.length} audiences to user ${userEmail}:`, matchedAudienceIds);
    }
    
    return { 
      success: true, 
      assignedAudiences: matchedAudienceIds 
    };
  } catch (error: any) {
    console.error('Error assigning audiences to user:', error);
    return { 
      success: false, 
      error: 'Failed to assign audiences to user' 
    };
  }
}

/**
 * Re-assign audiences when user updates their address
 */
export async function updateUserAudiencesOnAddressChange(
  userId: string,
  newAddress: string
): Promise<{ success: boolean; assignedAudiences?: string[]; error?: string }> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const userEmail = userData.email;
    
    // Use the assignAudiencesToUser function with new address
    return await assignAudiencesToUser(userEmail, newAddress);
  } catch (error: any) {
    console.error('Error updating user audiences:', error);
    return { 
      success: false, 
      error: 'Failed to update user audiences' 
    };
  }
}

/**
 * Re-assign audiences when user adds a new pet
 */
export async function updateUserAudiencesOnPetChange(
  userEmail: string
): Promise<{ success: boolean; assignedAudiences?: string[]; error?: string }> {
  try {
    // Get user's current address
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', userEmail)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      return { success: false, error: 'User not found' };
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const address = userData.address || '';
    
    // Re-assign audiences with updated pet information
    return await assignAudiencesToUser(userEmail, address);
  } catch (error: any) {
    console.error('Error updating user audiences on pet change:', error);
    return { 
      success: false, 
      error: 'Failed to update user audiences' 
    };
  }
}

