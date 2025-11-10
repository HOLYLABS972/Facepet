/**
 * Hebrew alphabet sorting utilities
 */

// Hebrew alphabet in order (Aleph to Tav)
const HEBREW_ALPHABET = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ך', 'ל', 'מ', 'ם', 
  'ן', 'נ', 'ס', 'ע', 'פ', 'ף', 'צ', 'ץ', 'ק', 'ר', 'ש', 'ת'
];

// Create a mapping of Hebrew letters to their sort order
const HEBREW_SORT_ORDER = new Map(
  HEBREW_ALPHABET.map((letter, index) => [letter, index])
);

/**
 * Get the first Hebrew letter of a string
 */
export function getFirstHebrewLetter(text: string): string | null {
  if (!text) return null;
  
  // Find the first Hebrew character
  for (const char of text) {
    if (HEBREW_SORT_ORDER.has(char)) {
      return char;
    }
  }
  
  return null;
}

/**
 * Compare two Hebrew strings for alphabetical sorting
 */
export function compareHebrew(a: string, b: string): number {
  const aText = a.trim();
  const bText = b.trim();
  
  // Handle empty strings
  if (!aText && !bText) return 0;
  if (!aText) return 1;
  if (!bText) return -1;
  
  // Compare character by character
  const minLength = Math.min(aText.length, bText.length);
  
  for (let i = 0; i < minLength; i++) {
    const aChar = aText[i];
    const bChar = bText[i];
    
    const aOrder = HEBREW_SORT_ORDER.get(aChar);
    const bOrder = HEBREW_SORT_ORDER.get(bChar);
    
    // If both characters are Hebrew letters
    if (aOrder !== undefined && bOrder !== undefined) {
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
    }
    // If only one is a Hebrew letter, Hebrew comes first
    else if (aOrder !== undefined && bOrder === undefined) {
      return -1;
    }
    else if (aOrder === undefined && bOrder !== undefined) {
      return 1;
    }
    // If neither is Hebrew, use regular string comparison
    else {
      const comparison = aChar.localeCompare(bChar);
      if (comparison !== 0) {
        return comparison;
      }
    }
  }
  
  // If all compared characters are equal, shorter string comes first
  return aText.length - bText.length;
}

/**
 * Sort an array of strings alphabetically in Hebrew
 */
export function sortHebrewStrings(strings: string[]): string[] {
  return [...strings].sort(compareHebrew);
}

/**
 * Group strings by their first Hebrew letter
 */
export function groupByHebrewLetter<T>(
  items: T[], 
  getTextFn: (item: T) => string
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  for (const item of items) {
    const text = getTextFn(item);
    const firstLetter = getFirstHebrewLetter(text);
    const key = firstLetter || '#'; // Use '#' for non-Hebrew items
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }
  
  // Sort items within each group
  for (const [key, group] of groups) {
    group.sort((a, b) => compareHebrew(getTextFn(a), getTextFn(b)));
  }
  
  return groups;
}

/**
 * Filter items by Hebrew letter range (e.g., 'א' to 'ה')
 */
export function filterByHebrewLetterRange<T>(
  items: T[],
  getTextFn: (item: T) => string,
  startLetter: string,
  endLetter: string
): T[] {
  const startOrder = HEBREW_SORT_ORDER.get(startLetter);
  const endOrder = HEBREW_SORT_ORDER.get(endLetter);
  
  if (startOrder === undefined || endOrder === undefined) {
    console.warn('Invalid Hebrew letters provided for filtering');
    return items;
  }
  
  return items.filter(item => {
    const text = getTextFn(item);
    const firstLetter = getFirstHebrewLetter(text);
    
    if (!firstLetter) return false;
    
    const letterOrder = HEBREW_SORT_ORDER.get(firstLetter);
    if (letterOrder === undefined) return false;
    
    return letterOrder >= startOrder && letterOrder <= endOrder;
  });
}

/**
 * Get all Hebrew letters that appear as first letters in a list of items
 */
export function getAvailableHebrewLetters<T>(
  items: T[],
  getTextFn: (item: T) => string
): string[] {
  const letters = new Set<string>();
  
  for (const item of items) {
    const text = getTextFn(item);
    const firstLetter = getFirstHebrewLetter(text);
    if (firstLetter) {
      letters.add(firstLetter);
    }
  }
  
  // Return sorted array of letters
  return Array.from(letters).sort((a, b) => {
    const aOrder = HEBREW_SORT_ORDER.get(a) || 999;
    const bOrder = HEBREW_SORT_ORDER.get(b) || 999;
    return aOrder - bOrder;
  });
}

/**
 * Hebrew alphabet letters for UI display
 */
export const HEBREW_LETTERS = HEBREW_ALPHABET;
