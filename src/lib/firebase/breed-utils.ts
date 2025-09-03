import { breedsByType } from '../data/breeds';

/**
 * Get breed name from breed ID string
 */
export function getBreedNameFromId(breedId: string): string {
  // Iterate through all pet types
  for (const [_, breeds] of Object.entries(breedsByType)) {
    const breed = breeds.find(b => b.id === breedId);
    if (breed) {
      return breed.name;
    }
  }
  return 'Unknown Breed';
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
