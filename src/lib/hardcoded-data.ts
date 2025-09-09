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

// Dog Breeds (15 breeds)
export const DOG_BREEDS: HardcodedBreed[] = [
  { value: 'labrador-retriever', label: 'Labrador Retriever', type: 'dog' },
  { value: 'golden-retriever', label: 'Golden Retriever', type: 'dog' },
  { value: 'german-shepherd', label: 'German Shepherd', type: 'dog' },
  { value: 'french-bulldog', label: 'French Bulldog', type: 'dog' },
  { value: 'bulldog', label: 'Bulldog', type: 'dog' },
  { value: 'poodle', label: 'Poodle', type: 'dog' },
  { value: 'beagle', label: 'Beagle', type: 'dog' },
  { value: 'rottweiler', label: 'Rottweiler', type: 'dog' },
  { value: 'siberian-husky', label: 'Siberian Husky', type: 'dog' },
  { value: 'border-collie', label: 'Border Collie', type: 'dog' },
  { value: 'pomeranian', label: 'Pomeranian', type: 'dog' },
  { value: 'dachshund', label: 'Dachshund', type: 'dog' },
  { value: 'boxer', label: 'Boxer', type: 'dog' },
  { value: 'great-dane', label: 'Great Dane', type: 'dog' },
  { value: 'chihuahua', label: 'Chihuahua', type: 'dog' }
];

// Dog Breeds in Hebrew (15 breeds)
export const DOG_BREEDS_HEBREW: HardcodedBreed[] = [
  { value: 'labrador-retriever', label: 'לברדור רטריבר', type: 'dog' },
  { value: 'golden-retriever', label: 'גולדן רטריבר', type: 'dog' },
  { value: 'german-shepherd', label: 'רועה גרמני', type: 'dog' },
  { value: 'french-bulldog', label: 'בולדוג צרפתי', type: 'dog' },
  { value: 'bulldog', label: 'בולדוג', type: 'dog' },
  { value: 'poodle', label: 'פודל', type: 'dog' },
  { value: 'beagle', label: 'ביגל', type: 'dog' },
  { value: 'rottweiler', label: 'רוטוויילר', type: 'dog' },
  { value: 'siberian-husky', label: 'האסקי סיבירי', type: 'dog' },
  { value: 'border-collie', label: 'בורדר קולי', type: 'dog' },
  { value: 'pomeranian', label: 'פומרניאן', type: 'dog' },
  { value: 'dachshund', label: 'דכשונד', type: 'dog' },
  { value: 'boxer', label: 'בוקסר', type: 'dog' },
  { value: 'great-dane', label: 'דני גדול', type: 'dog' },
  { value: 'chihuahua', label: 'צ\'יוואווה', type: 'dog' }
];

// Cat Breeds (15 breeds)
export const CAT_BREEDS: HardcodedBreed[] = [
  { value: 'persian', label: 'Persian', type: 'cat' },
  { value: 'maine-coon', label: 'Maine Coon', type: 'cat' },
  { value: 'british-shorthair', label: 'British Shorthair', type: 'cat' },
  { value: 'ragdoll', label: 'Ragdoll', type: 'cat' },
  { value: 'siamese', label: 'Siamese', type: 'cat' },
  { value: 'american-shorthair', label: 'American Shorthair', type: 'cat' },
  { value: 'abyssinian', label: 'Abyssinian', type: 'cat' },
  { value: 'scottish-fold', label: 'Scottish Fold', type: 'cat' },
  { value: 'sphynx', label: 'Sphynx', type: 'cat' },
  { value: 'bengal', label: 'Bengal', type: 'cat' },
  { value: 'russian-blue', label: 'Russian Blue', type: 'cat' },
  { value: 'norwegian-forest', label: 'Norwegian Forest Cat', type: 'cat' },
  { value: 'birman', label: 'Birman', type: 'cat' },
  { value: 'oriental-shorthair', label: 'Oriental Shorthair', type: 'cat' },
  { value: 'devon-rex', label: 'Devon Rex', type: 'cat' }
];

// Cat Breeds in Hebrew (15 breeds)
export const CAT_BREEDS_HEBREW: HardcodedBreed[] = [
  { value: 'persian', label: 'פרסי', type: 'cat' },
  { value: 'maine-coon', label: 'מיין קון', type: 'cat' },
  { value: 'british-shorthair', label: 'בריטי קצר שיער', type: 'cat' },
  { value: 'ragdoll', label: 'רגדול', type: 'cat' },
  { value: 'siamese', label: 'סיאמי', type: 'cat' },
  { value: 'american-shorthair', label: 'אמריקאי קצר שיער', type: 'cat' },
  { value: 'abyssinian', label: 'אביסיני', type: 'cat' },
  { value: 'scottish-fold', label: 'סקוטי מקופל אוזניים', type: 'cat' },
  { value: 'sphynx', label: 'ספינקס', type: 'cat' },
  { value: 'bengal', label: 'בנגל', type: 'cat' },
  { value: 'russian-blue', label: 'רוסי כחול', type: 'cat' },
  { value: 'norwegian-forest', label: 'נורווגי יער', type: 'cat' },
  { value: 'birman', label: 'בירמן', type: 'cat' },
  { value: 'oriental-shorthair', label: 'אוריינטלי קצר שיער', type: 'cat' },
  { value: 'devon-rex', label: 'דבון רקס', type: 'cat' }
];

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
