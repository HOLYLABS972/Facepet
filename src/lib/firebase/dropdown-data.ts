import { collection, getDocs } from 'firebase/firestore';
import { db } from './config';

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * Get all breeds for dropdown selection
 */
export async function getBreedsForDropdown(petType?: string): Promise<DropdownOption[]> {
  try {
    const breedsRef = collection(db, 'breeds');
    const snapshot = await getDocs(breedsRef);
    
    const options = snapshot.docs
      .map((doc, index) => {
        const data = doc.data();
        const value = data.labels?.en || data.name || 'Unknown Breed';
        const type = data.type || '';
        return {
          value: value,
          label: value,
          id: doc.id, // Use document ID for uniqueness
          index: index,
          type: type
        };
      })
      .filter(option => option.value && option.label); // Filter out any undefined values
    
    // Filter by pet type if provided
    let filteredOptions = options;
    if (petType) {
      console.log('Filtering breeds for pet type:', petType);
      console.log('Available breeds with types:', options.map(opt => ({ name: opt.value, type: opt.type })));
      filteredOptions = options.filter(option => 
        option.type.toLowerCase() === petType.toLowerCase()
      );
      console.log('Filtered breeds:', filteredOptions.map(opt => ({ name: opt.value, type: opt.type })));
    }
    
    // Remove duplicates based on value, keeping the first occurrence
    const uniqueOptions = filteredOptions.reduce((acc, current) => {
      const existing = acc.find(option => option.value === current.value);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof filteredOptions);
    
    return uniqueOptions.map(option => ({
      value: option.value,
      label: option.label
    }));
  } catch (error) {
    console.error('Error fetching breeds for dropdown:', error);
    return [];
  }
}

/**
 * Get all genders for dropdown selection
 */
export async function getGendersForDropdown(): Promise<DropdownOption[]> {
  try {
    const gendersRef = collection(db, 'genders');
    const snapshot = await getDocs(gendersRef);
    
    const options = snapshot.docs
      .map((doc, index) => {
        const data = doc.data();
        const value = data.labels?.en || data.name || 'Unknown Gender';
        return {
          value: value,
          label: value,
          id: doc.id,
          index: index
        };
      })
      .filter(option => option.value && option.label);
    
    // Remove duplicates based on value, keeping the first occurrence
    const uniqueOptions = options.reduce((acc, current) => {
      const existing = acc.find(option => option.value === current.value);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof options);
    
    return uniqueOptions.map(option => ({
      value: option.value,
      label: option.label
    }));
  } catch (error) {
    console.error('Error fetching genders for dropdown:', error);
    return [];
  }
}

/**
 * Get pet types for dropdown selection
 */
export async function getPetTypesForDropdown(): Promise<DropdownOption[]> {
  try {
    const typesRef = collection(db, 'petTypes');
    const snapshot = await getDocs(typesRef);
    
    const options = snapshot.docs
      .map((doc, index) => {
        const data = doc.data();
        const value = data.labels?.en || data.name || 'Unknown Type';
        return {
          value: value,
          label: value,
          id: doc.id,
          index: index
        };
      })
      .filter(option => option.value && option.label);
    
    // Remove duplicates based on value, keeping the first occurrence
    const uniqueOptions = options.reduce((acc, current) => {
      const existing = acc.find(option => option.value === current.value);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof options);
    
    return uniqueOptions.map(option => ({
      value: option.value,
      label: option.label
    }));
  } catch (error) {
    console.error('Error fetching pet types for dropdown:', error);
    // Return default types if collection doesn't exist
    return [
      { value: 'dog', label: 'Dog' },
      { value: 'cat', label: 'Cat' },
      { value: 'other', label: 'Other' }
    ];
  }
}
