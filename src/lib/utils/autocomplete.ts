/**
 * Enhanced autocomplete utilities with fuzzy matching and scoring
 */

export interface AutocompleteItem {
  id: string;
  name: string;
  [key: string]: any;
}

export interface AutocompleteMatch {
  item: AutocompleteItem;
  score: number;
  matchedIndices: number[];
  highlightedName: string;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate fuzzy match score for autocomplete
 */
function calculateFuzzyScore(query: string, target: string): { score: number; matchedIndices: number[] } {
  if (!query.trim()) return { score: 0, matchedIndices: [] };
  
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Exact match gets highest score
  if (targetLower === queryLower) {
    return { score: 100, matchedIndices: Array.from({ length: target.length }, (_, i) => i) };
  }
  
  // Starts with match gets high score
  if (targetLower.startsWith(queryLower)) {
    return { score: 90, matchedIndices: Array.from({ length: query.length }, (_, i) => i) };
  }
  
  // Contains match gets medium score
  const containsIndex = targetLower.indexOf(queryLower);
  if (containsIndex !== -1) {
    const matchedIndices = Array.from({ length: query.length }, (_, i) => containsIndex + i);
    return { score: 70 - containsIndex, matchedIndices };
  }
  
  // Fuzzy matching for partial matches
  const matchedIndices: number[] = [];
  let queryIndex = 0;
  let score = 0;
  
  for (let i = 0; i < targetLower.length && queryIndex < queryLower.length; i++) {
    if (targetLower[i] === queryLower[queryIndex]) {
      matchedIndices.push(i);
      queryIndex++;
      score += 10; // Base score for each matched character
      
      // Bonus for consecutive matches
      if (matchedIndices.length > 1 && matchedIndices[matchedIndices.length - 1] === matchedIndices[matchedIndices.length - 2] + 1) {
        score += 5;
      }
    }
  }
  
  // Check if all query characters were matched
  if (queryIndex === queryLower.length) {
    // Bonus for matching all characters
    score += 20;
    
    // Penalty for distance between matches
    if (matchedIndices.length > 1) {
      const spread = matchedIndices[matchedIndices.length - 1] - matchedIndices[0];
      score -= Math.floor(spread / 2);
    }
    
    // Bonus for shorter target strings (more relevant)
    score += Math.max(0, 50 - target.length);
    
    return { score: Math.max(0, score), matchedIndices };
  }
  
  return { score: 0, matchedIndices: [] };
}

/**
 * Highlight matched characters in a string
 */
function highlightMatches(text: string, matchedIndices: number[]): string {
  if (matchedIndices.length === 0) return text;
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    if (matchedIndices.includes(i)) {
      result += `<mark class="bg-yellow-200 text-yellow-900 px-0.5 rounded">${text[i]}</mark>`;
    } else {
      result += text[i];
    }
  }
  return result;
}

/**
 * Perform fuzzy search on a list of items
 */
export function fuzzySearch(
  query: string,
  items: AutocompleteItem[],
  options: {
    limit?: number;
    minScore?: number;
    searchFields?: string[];
  } = {}
): AutocompleteMatch[] {
  const { limit = 10, minScore = 10, searchFields = ['name'] } = options;
  
  if (!query.trim()) {
    return items.slice(0, limit).map(item => ({
      item,
      score: 0,
      matchedIndices: [],
      highlightedName: item.name
    }));
  }
  
  const matches: AutocompleteMatch[] = [];
  
  for (const item of items) {
    let bestScore = 0;
    let bestMatchedIndices: number[] = [];
    let bestField = 'name';
    
    // Check all specified fields
    for (const field of searchFields) {
      const fieldValue = item[field];
      if (typeof fieldValue === 'string') {
        const { score, matchedIndices } = calculateFuzzyScore(query, fieldValue);
        if (score > bestScore) {
          bestScore = score;
          bestMatchedIndices = matchedIndices;
          bestField = field;
        }
      }
    }
    
    if (bestScore >= minScore) {
      matches.push({
        item,
        score: bestScore,
        matchedIndices: bestMatchedIndices,
        highlightedName: bestField === 'name' 
          ? highlightMatches(item.name, bestMatchedIndices)
          : item.name
      });
    }
  }
  
  // Sort by score (descending) and then by name length (ascending)
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.name.length - b.item.name.length;
  });
  
  return matches.slice(0, limit);
}

/**
 * Get suggestions based on partial input
 */
export function getSuggestions(
  query: string,
  items: AutocompleteItem[],
  recentSelections: string[] = [],
  options: {
    limit?: number;
    includeRecent?: boolean;
    minScore?: number;
  } = {}
): AutocompleteMatch[] {
  const { limit = 10, includeRecent = true, minScore = 10 } = options;
  
  // If no query, show recent selections first
  if (!query.trim() && includeRecent && recentSelections.length > 0) {
    const recentItems = items.filter(item => recentSelections.includes(item.id));
    const otherItems = items.filter(item => !recentSelections.includes(item.id));
    
    const recentMatches = recentItems.slice(0, Math.min(3, limit)).map(item => ({
      item,
      score: 100, // High score for recent items
      matchedIndices: [],
      highlightedName: item.name
    }));
    
    const remainingLimit = limit - recentMatches.length;
    const otherMatches = otherItems.slice(0, remainingLimit).map(item => ({
      item,
      score: 0,
      matchedIndices: [],
      highlightedName: item.name
    }));
    
    return [...recentMatches, ...otherMatches];
  }
  
  // Perform fuzzy search
  const matches = fuzzySearch(query, items, { limit, minScore });
  
  // Boost score for recent selections
  if (includeRecent && recentSelections.length > 0) {
    matches.forEach(match => {
      if (recentSelections.includes(match.item.id)) {
        match.score += 15; // Boost recent items
      }
    });
    
    // Re-sort after boosting
    matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.name.length - b.item.name.length;
    });
  }
  
  return matches;
}

/**
 * Manage recent selections with local storage
 */
export class RecentSelectionsManager {
  private storageKey: string;
  private maxItems: number;
  
  constructor(storageKey: string, maxItems: number = 5) {
    this.storageKey = storageKey;
    this.maxItems = maxItems;
  }
  
  getRecent(): string[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  addRecent(id: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const recent = this.getRecent();
      const filtered = recent.filter(item => item !== id);
      const updated = [id, ...filtered].slice(0, this.maxItems);
      
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }
  
  clearRecent(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
