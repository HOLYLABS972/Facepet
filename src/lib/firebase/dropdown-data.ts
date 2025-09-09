import { getPetTypes, getBreedsByType, getGenders, ALL_BREEDS, ALL_BREEDS_HEBREW } from '../hardcoded-data';

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * Get all breeds for dropdown selection
 */
export async function getBreedsForDropdown(petType?: string, locale: 'en' | 'he' = 'en'): Promise<DropdownOption[]> {
  try {
    if (petType) {
      const breeds = getBreedsByType(petType, locale);
      return breeds.map(breed => ({
        value: breed.value,
        label: breed.label
      }));
    }
    
    // Return all breeds if no type specified
    const allBreeds = locale === 'he' ? ALL_BREEDS_HEBREW : ALL_BREEDS;
    
    return allBreeds.map(breed => ({
      value: breed.value,
      label: breed.label
    }));
  } catch (error) {
    console.error('Error getting breeds for dropdown:', error);
    return [];
  }
}

/**
 * Get all genders for dropdown selection
 */
export async function getGendersForDropdown(locale: 'en' | 'he' = 'en'): Promise<DropdownOption[]> {
  try {
    const genders = getGenders(locale);
    return genders.map(gender => ({
      value: gender.value,
      label: gender.label
    }));
  } catch (error) {
    console.error('Error fetching genders for dropdown:', error);
    return [];
  }
}

/**
 * Get pet types for dropdown selection
 */
export async function getPetTypesForDropdown(locale: 'en' | 'he' = 'en'): Promise<DropdownOption[]> {
  try {
    const types = getPetTypes(locale);
    return types.map(type => ({
      value: type.value,
      label: type.label
    }));
  } catch (error) {
    console.error('Error fetching pet types for dropdown:', error);
    // Return default types if error occurs
    return [
      { value: 'dog', label: 'Dog' },
      { value: 'cat', label: 'Cat' },
      { value: 'other', label: 'Other' }
    ];
  }
}
