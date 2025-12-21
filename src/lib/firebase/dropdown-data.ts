import { getPetTypes, getBreedsByType, getGenders, ALL_BREEDS, ALL_BREEDS_HEBREW } from '../hardcoded-data';
import { getLocalizedBreedsForType } from '../data/breeds';

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
      // Use comprehensive breeds data with proper Hebrew translations
      const breeds = getLocalizedBreedsForType(petType as 'dog' | 'cat' | 'other', locale);
      return breeds.map(breed => ({
        value: breed.id,
        label: breed.name
      }));
    }
    
    // Return all breeds if no type specified - combine dog and cat breeds
    const dogBreeds = getLocalizedBreedsForType('dog', locale);
    const catBreeds = getLocalizedBreedsForType('cat', locale);
    const otherBreeds = getLocalizedBreedsForType('other', locale);
    
    const allBreeds = [...dogBreeds, ...catBreeds, ...otherBreeds];
    
    return allBreeds.map(breed => ({
      value: breed.id,
      label: breed.name
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

/**
 * Get areas for dropdown selection
 */
export async function getAreasForDropdown(locale: 'en' | 'he' = 'he'): Promise<DropdownOption[]> {
  const areas = locale === 'he' 
    ? [
        { value: 'מרכז', label: 'מרכז' },
        { value: 'צפון', label: 'צפון' },
        { value: 'דרום', label: 'דרום' },
        { value: 'ירושלים והסביבה', label: 'ירושלים והסביבה' },
        { value: 'שרון', label: 'שרון' },
        { value: 'שפלה', label: 'שפלה' },
        { value: 'גליל', label: 'גליל' },
        { value: 'גולן', label: 'גולן' },
        { value: 'נגב', label: 'נגב' }
      ]
    : [
        { value: 'Center', label: 'Center' },
        { value: 'North', label: 'North' },
        { value: 'South', label: 'South' },
        { value: 'Jerusalem Area', label: 'Jerusalem Area' },
        { value: 'Sharon', label: 'Sharon' },
        { value: 'Shephelah', label: 'Shephelah' },
        { value: 'Galilee', label: 'Galilee' },
        { value: 'Golan', label: 'Golan' },
        { value: 'Negev', label: 'Negev' }
      ];
  return areas;
}

/**
 * Get cities for dropdown selection
 */
export async function getCitiesForDropdown(locale: 'en' | 'he' = 'he'): Promise<DropdownOption[]> {
  const cities = locale === 'he'
    ? [
        { value: 'תל אביב', label: 'תל אביב' },
        { value: 'ירושלים', label: 'ירושלים' },
        { value: 'חיפה', label: 'חיפה' },
        { value: 'באר שבע', label: 'באר שבע' },
        { value: 'רמת גן', label: 'רמת גן' },
        { value: 'אשדוד', label: 'אשדוד' },
        { value: 'נתניה', label: 'נתניה' },
        { value: 'בני ברק', label: 'בני ברק' },
        { value: 'בת ים', label: 'בת ים' },
        { value: 'אשקלון', label: 'אשקלון' },
        { value: 'רחובות', label: 'רחובות' },
        { value: 'הרצליה', label: 'הרצליה' },
        { value: 'כפר סבא', label: 'כפר סבא' },
        { value: 'רמלה', label: 'רמלה' },
        { value: 'לוד', label: 'לוד' }
      ]
    : [
        { value: 'Tel Aviv', label: 'Tel Aviv' },
        { value: 'Jerusalem', label: 'Jerusalem' },
        { value: 'Haifa', label: 'Haifa' },
        { value: 'Beer Sheva', label: 'Beer Sheva' },
        { value: 'Ramat Gan', label: 'Ramat Gan' },
        { value: 'Ashdod', label: 'Ashdod' },
        { value: 'Netanya', label: 'Netanya' },
        { value: 'Bnei Brak', label: 'Bnei Brak' },
        { value: 'Bat Yam', label: 'Bat Yam' },
        { value: 'Ashkelon', label: 'Ashkelon' },
        { value: 'Rehovot', label: 'Rehovot' },
        { value: 'Herzliya', label: 'Herzliya' },
        { value: 'Kfar Saba', label: 'Kfar Saba' },
        { value: 'Ramla', label: 'Ramla' },
        { value: 'Lod', label: 'Lod' }
      ];
  return cities;
}

/**
 * Get age ranges for dropdown selection
 */
export async function getAgeRangesForDropdown(locale: 'en' | 'he' = 'he'): Promise<DropdownOption[]> {
  const ageRanges = locale === 'he'
    ? [
        { value: '0-3 חודשים', label: '0-3 חודשים' },
        { value: '3-6 חודשים', label: '3-6 חודשים' },
        { value: '6-12 חודשים', label: '6-12 חודשים' },
        { value: '1-2 שנים', label: '1-2 שנים' },
        { value: '2-3 שנים', label: '2-3 שנים' },
        { value: '3-5 שנים', label: '3-5 שנים' },
        { value: '5-7 שנים', label: '5-7 שנים' },
        { value: '7-10 שנים', label: '7-10 שנים' },
        { value: '10+ שנים', label: '10+ שנים' }
      ]
    : [
        { value: '0-3 months', label: '0-3 months' },
        { value: '3-6 months', label: '3-6 months' },
        { value: '6-12 months', label: '6-12 months' },
        { value: '1-2 years', label: '1-2 years' },
        { value: '2-3 years', label: '2-3 years' },
        { value: '3-5 years', label: '3-5 years' },
        { value: '5-7 years', label: '5-7 years' },
        { value: '7-10 years', label: '7-10 years' },
        { value: '10+ years', label: '10+ years' }
      ];
  return ageRanges;
}

/**
 * Get weight ranges for dropdown selection
 */
export async function getWeightRangesForDropdown(locale: 'en' | 'he' = 'he'): Promise<DropdownOption[]> {
  const weightRanges = locale === 'he'
    ? [
        { value: 'עד 1 ק"ג', label: 'עד 1 ק"ג' },
        { value: '1-3 ק"ג', label: '1-3 ק"ג' },
        { value: '3-5 ק"ג', label: '3-5 ק"ג' },
        { value: '5-10 ק"ג', label: '5-10 ק"ג' },
        { value: '10-15 ק"ג', label: '10-15 ק"ג' },
        { value: '15-20 ק"ג', label: '15-20 ק"ג' },
        { value: '20-30 ק"ג', label: '20-30 ק"ג' },
        { value: '30-40 ק"ג', label: '30-40 ק"ג' },
        { value: '40-50 ק"ג', label: '40-50 ק"ג' },
        { value: '50+ ק"ג', label: '50+ ק"ג' }
      ]
    : [
        { value: 'Up to 1 kg', label: 'Up to 1 kg' },
        { value: '1-3 kg', label: '1-3 kg' },
        { value: '3-5 kg', label: '3-5 kg' },
        { value: '5-10 kg', label: '5-10 kg' },
        { value: '10-15 kg', label: '10-15 kg' },
        { value: '15-20 kg', label: '15-20 kg' },
        { value: '20-30 kg', label: '20-30 kg' },
        { value: '30-40 kg', label: '30-40 kg' },
        { value: '40-50 kg', label: '40-50 kg' },
        { value: '50+ kg', label: '50+ kg' }
      ];
  return weightRanges;
}
