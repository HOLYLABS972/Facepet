'use client';

import { useState } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { HEBREW_LETTERS, getAvailableHebrewLetters } from '@/src/lib/utils/hebrew-sort';

interface HebrewAlphabetFilterProps {
  items: Array<{ name: string; [key: string]: any }>;
  onFilterChange: (filteredItems: Array<{ name: string; [key: string]: any }>) => void;
  className?: string;
  showAllLetters?: boolean; // Show all Hebrew letters or only available ones
}

export function HebrewAlphabetFilter({
  items,
  onFilterChange,
  className,
  showAllLetters = false
}: HebrewAlphabetFilterProps) {
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  
  // Get available letters from the items
  const availableLetters = getAvailableHebrewLetters(items, item => item.name);
  
  // Determine which letters to show
  const lettersToShow = showAllLetters ? HEBREW_LETTERS : availableLetters;
  
  const handleLetterClick = (letter: string) => {
    let newSelectedLetters: string[];
    
    if (selectedLetters.includes(letter)) {
      // Remove letter if already selected
      newSelectedLetters = selectedLetters.filter(l => l !== letter);
    } else {
      // Add letter to selection
      newSelectedLetters = [...selectedLetters, letter];
    }
    
    setSelectedLetters(newSelectedLetters);
    
    // Filter items based on selected letters
    if (newSelectedLetters.length === 0) {
      // No filters, show all items
      onFilterChange(items);
    } else {
      // Filter items that start with any of the selected letters
      const filtered = items.filter(item => {
        const firstLetter = item.name.charAt(0);
        return newSelectedLetters.includes(firstLetter);
      });
      onFilterChange(filtered);
    }
  };
  
  const clearFilters = () => {
    setSelectedLetters([]);
    onFilterChange(items);
  };
  
  if (lettersToShow.length === 0) {
    return null;
  }
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Filter controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          סינון לפי אות ראשונה
        </h3>
        {selectedLetters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-auto p-1 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            נקה הכל
          </Button>
        )}
      </div>
      
      {/* Selected letters display */}
      {selectedLetters.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLetters.map(letter => (
            <Badge
              key={letter}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-700"
              onClick={() => handleLetterClick(letter)}
            >
              {letter}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
      
      {/* Hebrew alphabet grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
        {lettersToShow.map(letter => {
          const isSelected = selectedLetters.includes(letter);
          const isAvailable = availableLetters.includes(letter);
          
          return (
            <Button
              key={letter}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 w-8 p-0 text-sm font-medium",
                !isAvailable && !showAllLetters && "opacity-50 cursor-not-allowed",
                isSelected && "bg-blue-600 hover:bg-blue-700",
                !isSelected && isAvailable && "hover:bg-blue-50"
              )}
              onClick={() => handleLetterClick(letter)}
              disabled={!isAvailable && !showAllLetters}
            >
              {letter}
            </Button>
          );
        })}
      </div>
      
      {/* Results count */}
      {selectedLetters.length > 0 && (
        <div className="text-xs text-gray-500">
          מציג פריטים המתחילים ב: {selectedLetters.join(', ')}
        </div>
      )}
    </div>
  );
}

// Letter range selector component
interface HebrewLetterRangeSelectorProps {
  items: Array<{ name: string; [key: string]: any }>;
  onFilterChange: (filteredItems: Array<{ name: string; [key: string]: any }>) => void;
  className?: string;
}

export function HebrewLetterRangeSelector({
  items,
  onFilterChange,
  className
}: HebrewLetterRangeSelectorProps) {
  const [startLetter, setStartLetter] = useState<string>('');
  const [endLetter, setEndLetter] = useState<string>('');
  
  const availableLetters = getAvailableHebrewLetters(items, item => item.name);
  
  const handleRangeChange = (start: string, end: string) => {
    setStartLetter(start);
    setEndLetter(end);
    
    if (!start || !end) {
      onFilterChange(items);
      return;
    }
    
    // Get the order of letters in Hebrew alphabet
    const startIndex = HEBREW_LETTERS.indexOf(start);
    const endIndex = HEBREW_LETTERS.indexOf(end);
    
    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
      onFilterChange(items);
      return;
    }
    
    // Filter items within the range
    const rangeLetters = HEBREW_LETTERS.slice(startIndex, endIndex + 1);
    const filtered = items.filter(item => {
      const firstLetter = item.name.charAt(0);
      return rangeLetters.includes(firstLetter);
    });
    
    onFilterChange(filtered);
  };
  
  const clearRange = () => {
    setStartLetter('');
    setEndLetter('');
    onFilterChange(items);
  };
  
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          סינון לפי טווח אותיות
        </h3>
        {(startLetter || endLetter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearRange}
            className="h-auto p-1 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            נקה
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <span>מ:</span>
        <select
          value={startLetter}
          onChange={(e) => handleRangeChange(e.target.value, endLetter)}
          className="border rounded px-2 py-1 text-center"
        >
          <option value="">בחר</option>
          {availableLetters.map(letter => (
            <option key={letter} value={letter}>{letter}</option>
          ))}
        </select>
        
        <span>עד:</span>
        <select
          value={endLetter}
          onChange={(e) => handleRangeChange(startLetter, e.target.value)}
          className="border rounded px-2 py-1 text-center"
          disabled={!startLetter}
        >
          <option value="">בחר</option>
          {availableLetters
            .filter(letter => !startLetter || HEBREW_LETTERS.indexOf(letter) >= HEBREW_LETTERS.indexOf(startLetter))
            .map(letter => (
              <option key={letter} value={letter}>{letter}</option>
            ))}
        </select>
      </div>
      
      {startLetter && endLetter && (
        <div className="text-xs text-gray-500">
          מציג גזעים מ-{startLetter} עד {endLetter}
        </div>
      )}
    </div>
  );
}
