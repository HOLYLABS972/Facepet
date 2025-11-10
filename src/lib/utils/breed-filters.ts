/**
 * Utility functions for filtering breeds by Hebrew alphabet
 */

import { getLocalizedBreedsForType, type PetType } from '@/src/lib/data/breeds';
import { 
  compareHebrew, 
  getFirstHebrewLetter, 
  filterByHebrewLetterRange,
  getAvailableHebrewLetters,
  groupByHebrewLetter 
} from './hebrew-sort';

export interface BreedItem {
  id: string;
  name: string;
}

/**
 * Get breeds for a pet type, sorted alphabetically in Hebrew
 */
export function getHebrewSortedBreeds(petType: PetType, locale: 'en' | 'he' = 'he'): BreedItem[] {
  try {
    const breeds = getLocalizedBreedsForType(petType, locale);
    if (locale === 'he') {
      return breeds.sort((a, b) => compareHebrew(a.name, b.name));
    }
    return breeds;
  } catch (error) {
    console.error('Error getting Hebrew sorted breeds:', error);
    return [];
  }
}

/**
 * Filter breeds by Hebrew letters
 */
export function filterBreedsByHebrewLetters(
  breeds: BreedItem[],
  letters: string[]
): BreedItem[] {
  if (letters.length === 0) return breeds;
  
  return breeds.filter(breed => {
    const firstLetter = getFirstHebrewLetter(breed.name);
    return firstLetter && letters.includes(firstLetter);
  });
}

/**
 * Filter breeds by Hebrew letter range
 */
export function filterBreedsByHebrewRange(
  breeds: BreedItem[],
  startLetter: string,
  endLetter: string
): BreedItem[] {
  return filterByHebrewLetterRange(breeds, breed => breed.name, startLetter, endLetter);
}

/**
 * Group breeds by their first Hebrew letter
 */
export function groupBreedsByHebrewLetter(breeds: BreedItem[]): Map<string, BreedItem[]> {
  return groupByHebrewLetter(breeds, breed => breed.name);
}

/**
 * Get available Hebrew letters from a list of breeds
 */
export function getAvailableHebrewLettersFromBreeds(breeds: BreedItem[]): string[] {
  return getAvailableHebrewLetters(breeds, breed => breed.name);
}

/**
 * Search breeds by name (case insensitive, works with Hebrew)
 */
export function searchBreeds(breeds: BreedItem[], searchTerm: string): BreedItem[] {
  if (!searchTerm.trim()) return breeds;
  
  const term = searchTerm.toLowerCase().trim();
  return breeds.filter(breed => 
    breed.name.toLowerCase().includes(term)
  );
}

/**
 * Combined filter function that applies multiple filters
 */
export function filterBreeds(
  breeds: BreedItem[],
  filters: {
    searchTerm?: string;
    hebrewLetters?: string[];
    hebrewRange?: { start: string; end: string };
  }
): BreedItem[] {
  let filtered = breeds;
  
  // Apply search filter
  if (filters.searchTerm) {
    filtered = searchBreeds(filtered, filters.searchTerm);
  }
  
  // Apply Hebrew letter filter
  if (filters.hebrewLetters && filters.hebrewLetters.length > 0) {
    filtered = filterBreedsByHebrewLetters(filtered, filters.hebrewLetters);
  }
  
  // Apply Hebrew range filter
  if (filters.hebrewRange && filters.hebrewRange.start && filters.hebrewRange.end) {
    filtered = filterBreedsByHebrewRange(filtered, filters.hebrewRange.start, filters.hebrewRange.end);
  }
  
  return filtered;
}

/**
 * Get breed statistics for Hebrew letters
 */
export function getBreedStatsByHebrewLetter(breeds: BreedItem[]): Array<{
  letter: string;
  count: number;
  breeds: BreedItem[];
}> {
  const groups = groupBreedsByHebrewLetter(breeds);
  
  return Array.from(groups.entries())
    .map(([letter, breedList]) => ({
      letter,
      count: breedList.length,
      breeds: breedList
    }))
    .sort((a, b) => {
      // Sort by Hebrew alphabet order
      const hebrewOrder = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ך', 'ל', 'מ', 'ם', 'ן', 'נ', 'ס', 'ע', 'פ', 'ף', 'צ', 'ץ', 'ק', 'ר', 'ש', 'ת'];
      const aIndex = hebrewOrder.indexOf(a.letter);
      const bIndex = hebrewOrder.indexOf(b.letter);
      
      if (aIndex === -1 && bIndex === -1) return a.letter.localeCompare(b.letter);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
}
