// Hardcoded data for pet types, breeds, and genders
// Supporting English and Hebrew languages

export interface HardcodedOption {
  value: string;
  label: string;
  type?: string; // For breeds only
}

export interface HardcodedBreed extends HardcodedOption {
  type: string;
}

// Pet Types
export const PET_TYPES: HardcodedOption[] = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'other', label: 'Other' }
];

// Pet Types in Hebrew
export const PET_TYPES_HEBREW: HardcodedOption[] = [
  { value: 'dog', label: 'כלב' },
  { value: 'cat', label: 'חתול' },
  { value: 'other', label: 'אחר' }
];

// Import comprehensive breed data
import { breedsByType as comprehensiveBreedsByType } from './data/comprehensive-breeds';

// Dog Breeds - All breeds from breeds.json (174 breeds)
export const DOG_BREEDS: HardcodedBreed[] = comprehensiveBreedsByType.dog.map(breed => ({
  value: breed.en.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
  label: breed.en,
  type: 'dog'
}));

// Dog Breeds in Hebrew - All breeds from breeds.json (174 breeds)
export const DOG_BREEDS_HEBREW: HardcodedBreed[] = comprehensiveBreedsByType.dog.map(breed => ({
  value: breed.en.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
  label: breed.he,
  type: 'dog'
}));

// Cat Breeds - All breeds from breeds.json (35 breeds)
export const CAT_BREEDS: HardcodedBreed[] = comprehensiveBreedsByType.cat.map(breed => ({
  value: breed.en.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
  label: breed.en,
  type: 'cat'
}));

// Cat Breeds in Hebrew - All breeds from breeds.json (35 breeds)
export const CAT_BREEDS_HEBREW: HardcodedBreed[] = comprehensiveBreedsByType.cat.map(breed => ({
  value: breed.en.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
  label: breed.he,
  type: 'cat'
}));

// Genders
export const GENDERS: HardcodedOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
];

// Genders in Hebrew
export const GENDERS_HEBREW: HardcodedOption[] = [
  { value: 'male', label: 'זכר' },
  { value: 'female', label: 'נקבה' }
];

// Combined breeds for easy access
export const ALL_BREEDS: HardcodedBreed[] = [...DOG_BREEDS, ...CAT_BREEDS];
export const ALL_BREEDS_HEBREW: HardcodedBreed[] = [...DOG_BREEDS_HEBREW, ...CAT_BREEDS_HEBREW];

// Helper functions to get data based on locale
export function getPetTypes(locale: 'en' | 'he' = 'en'): HardcodedOption[] {
  return locale === 'he' ? PET_TYPES_HEBREW : PET_TYPES;
}

export function getBreeds(locale: 'en' | 'he' = 'en'): HardcodedBreed[] {
  return locale === 'he' ? ALL_BREEDS_HEBREW : ALL_BREEDS;
}

export function getBreedsByType(petType: string, locale: 'en' | 'he' = 'en'): HardcodedBreed[] {
  const breeds = getBreeds(locale);
  return breeds.filter(breed => breed.type === petType);
}

export function getGenders(locale: 'en' | 'he' = 'en'): HardcodedOption[] {
  return locale === 'he' ? GENDERS_HEBREW : GENDERS;
}
