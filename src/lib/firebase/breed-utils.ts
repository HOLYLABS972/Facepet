import { breedsByType, getLocalizedBreedName } from '../data/breeds';

/**
 * Get breed name from breed ID string
 */
export function getBreedNameFromId(breedId: string, locale: 'en' | 'he' = 'en'): string {
  // Iterate through all pet types
  for (const [_, breeds] of Object.entries(breedsByType)) {
    const breed = breeds.find(b => b.id === breedId);
    if (breed) {
      return getLocalizedBreedName(breed, locale);
    }
  }
  return locale === 'he' ? 'גזע לא ידוע' : 'Unknown Breed';
}

/**
 * Get breed ID from breed name
 */
export function getBreedIdFromName(breedName: string): string {
  // Iterate through all pet types
  for (const [_, breeds] of Object.entries(breedsByType)) {
    const breed = breeds.find(b => b.name === breedName);
    if (breed) {
      return breed.id;
    }
  }
  return '';
}

/**
 * Convert breed slug to human-readable text
 * Handles cases where breed is stored as slug (e.g., "devon-rex" -> "Devon Rex")
 */
export function convertBreedSlugToName(breedSlug: string, locale: 'en' | 'he' = 'en'): string {
  if (!breedSlug) return locale === 'he' ? 'גזע לא ידוע' : 'Unknown Breed';
  
  // If it's already human-readable (contains spaces or proper capitalization), return as is
  if (breedSlug.includes(' ') || breedSlug === breedSlug.charAt(0).toUpperCase() + breedSlug.slice(1)) {
    return breedSlug;
  }
  
  // Convert slug to human-readable format
  // Replace hyphens with spaces and capitalize each word
  const humanReadable = breedSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Try to find exact match in breed data
  for (const [_, breeds] of Object.entries(breedsByType)) {
    const breed = breeds.find(b => 
      b.name.toLowerCase() === humanReadable.toLowerCase() ||
      b.name.toLowerCase() === breedSlug.toLowerCase()
    );
    if (breed) {
      return getLocalizedBreedName(breed, locale);
    }
  }
  
  // If no exact match found, return the converted slug
  return humanReadable;
}
