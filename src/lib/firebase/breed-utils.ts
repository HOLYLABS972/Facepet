import { breedsByType, getLocalizedBreedName } from '../data/breeds';
import { breedsData } from '../data/comprehensive-breeds';

/**
 * Get breed name from breed ID string
 */
export function getBreedNameFromId(breedId: string, locale: 'en' | 'he' = 'en'): string {
  // First try to find by ID in comprehensive breeds data
  const breed = breedsData.find(b => String(b.id) === breedId);
  if (breed) {
    return locale === 'he' ? breed.he : breed.en;
  }
  
  // Fallback to legacy breed data
  for (const [_, breeds] of Object.entries(breedsByType)) {
    const legacyBreed = breeds.find(b => b.id === breedId);
    if (legacyBreed) {
      return getLocalizedBreedName(legacyBreed, locale);
    }
  }
  return locale === 'he' ? 'גזע לא ידוע' : 'Unknown Breed';
}

/**
 * Get breed ID from breed name
 */
export function getBreedIdFromName(breedName: string): string {
  // First try to find in comprehensive breeds data
  const breed = breedsData.find(b => 
    b.en.toLowerCase() === breedName.toLowerCase() || 
    b.he === breedName
  );
  if (breed) {
    return String(breed.id);
  }
  
  // Fallback to legacy breed data
  for (const [_, breeds] of Object.entries(breedsByType)) {
    const legacyBreed = breeds.find(b => b.name === breedName);
    if (legacyBreed) {
      return legacyBreed.id;
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
  
  // Try to find exact match in comprehensive breeds data first
  const breed = breedsData.find(b => 
    b.en.toLowerCase() === humanReadable.toLowerCase() ||
    b.en.toLowerCase() === breedSlug.toLowerCase()
  );
  if (breed) {
    return locale === 'he' ? breed.he : breed.en;
  }
  
  // Fallback to legacy breed data
  for (const [_, breeds] of Object.entries(breedsByType)) {
    const legacyBreed = breeds.find(b => 
      b.name.toLowerCase() === humanReadable.toLowerCase() ||
      b.name.toLowerCase() === breedSlug.toLowerCase()
    );
    if (legacyBreed) {
      return getLocalizedBreedName(legacyBreed, locale);
    }
  }
  
  // If no exact match found, return the converted slug
  return humanReadable;
}
