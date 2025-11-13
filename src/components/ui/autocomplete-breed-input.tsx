'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Check, X, Clock, Star, Search } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/src/lib/utils';
import { Badge } from './badge';
import { Button } from './button';
import { getLocalizedBreedsForType, type PetType } from '@/src/lib/data/breeds';
import { compareHebrew } from '@/src/lib/utils/hebrew-sort';
import { 
  getSuggestions, 
  RecentSelectionsManager, 
  debounce,
  type AutocompleteItem,
  type AutocompleteMatch 
} from '@/src/lib/utils/autocomplete';

interface AutocompleteBreedInputProps {
  petType: PetType;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  allowCustomInput?: boolean; // Allow typing custom breed names
  maxSuggestions?: number;
}

export function AutocompleteBreedInput({
  petType,
  value,
  onValueChange,
  placeholder,
  className,
  label,
  required = false,
  hasError = false,
  disabled = false,
  allowCustomInput = false,
  maxSuggestions = 8
}: AutocompleteBreedInputProps) {
  const t = useTranslations('Pet.add.form.breed');
  const locale = useLocale() as 'en' | 'he';
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [autocompleteMatches, setAutocompleteMatches] = useState<AutocompleteMatch[]>([]);
  const [recentSelections, setRecentSelections] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize recent selections manager
  const recentManager = useMemo(() => 
    new RecentSelectionsManager(`breed-autocomplete-${petType}-${locale}`, 5), 
    [petType, locale]
  );

  // Load recent selections on mount
  useEffect(() => {
    setRecentSelections(recentManager.getRecent());
  }, [recentManager]);

  const breeds = useMemo(() => {
    try {
      const breedList = getLocalizedBreedsForType(petType, locale);
      // Sort Hebrew breeds alphabetically when in Hebrew locale
      if (locale === 'he') {
        return breedList.sort((a, b) => compareHebrew(a.name, b.name));
      }
      return breedList;
    } catch (error) {
      console.error('Error getting breeds for type:', petType, error);
      return [];
    }
  }, [petType, locale]);

  // Convert breeds to autocomplete items
  const autocompleteItems: AutocompleteItem[] = useMemo(() => 
    breeds.map(breed => ({
      id: breed.id,
      name: breed.name,
      ...breed
    })), 
    [breeds]
  );

  // Find selected breed
  const selectedBreed = breeds.find(breed => breed.id === value);

  // Update input value when external value changes
  useEffect(() => {
    if (selectedBreed) {
      setInputValue(selectedBreed.name);
    } else if (!allowCustomInput) {
      setInputValue('');
    }
  }, [selectedBreed, allowCustomInput]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      const matches = getSuggestions(query, autocompleteItems, recentSelections, {
        limit: maxSuggestions,
        includeRecent: true,
        minScore: query.trim() ? 1 : 0  // Lower minimum score for better multi-word and Hebrew matching
      });
      setAutocompleteMatches(matches);
      setSelectedIndex(-1);
    }, 100),
    [autocompleteItems, recentSelections, maxSuggestions]
  );

  // Update search results when input value changes
  useEffect(() => {
    if (showSuggestions) {
      debouncedSearch(inputValue);
    }
  }, [inputValue, debouncedSearch, showSuggestions]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setShowSuggestions(true);
    
    if (allowCustomInput) {
      // For custom input, update value immediately
      onValueChange(newValue);
    } else {
      // For breed selection, only update if it matches a breed
      const matchingBreed = breeds.find(breed => 
        breed.name.toLowerCase() === newValue.toLowerCase()
      );
      onValueChange(matchingBreed?.id || '');
    }
  };

  const handleSuggestionSelect = (match: AutocompleteMatch) => {
    setInputValue(match.item.name);
    onValueChange(match.item.id);
    recentManager.addRecent(match.item.id);
    setRecentSelections(recentManager.getRecent());
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || autocompleteMatches.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setShowSuggestions(true);
        debouncedSearch(inputValue);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < autocompleteMatches.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : autocompleteMatches.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < autocompleteMatches.length) {
          handleSuggestionSelect(autocompleteMatches[selectedIndex]);
        } else if (autocompleteMatches.length === 1) {
          handleSuggestionSelect(autocompleteMatches[0]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < autocompleteMatches.length) {
          e.preventDefault();
          handleSuggestionSelect(autocompleteMatches[selectedIndex]);
        } else {
          setShowSuggestions(false);
        }
        break;
    }
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    if (autocompleteMatches.length === 0) {
      debouncedSearch(inputValue);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  const clearInput = () => {
    setInputValue('');
    onValueChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label
          className={cn(
            'absolute top-2.5 left-3 w-fit text-sm text-gray-500 transition-all duration-200 ease-in-out rtl:right-3',
            (inputValue || showSuggestions) && 'text-primary -top-6 text-sm font-medium',
            hasError && 'text-red-800'
          )}
        >
          {label}
          {required && '*'}
        </label>
      )}
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder || t('searchPlaceholder')}
            disabled={disabled}
            className={cn(
              "w-full h-10 pl-10 pr-10 border border-gray-300 rounded-md bg-white text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              hasError && "border-red-500 focus:ring-red-500 focus:border-red-500"
            )}
          />
          {inputValue && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearInput}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && autocompleteMatches.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {autocompleteMatches.map((match, index) => {
              const isRecent = recentSelections.includes(match.item.id);
              const isSelected = index === selectedIndex;
              
              return (
                <div
                  key={match.item.id}
                  onClick={() => handleSuggestionSelect(match)}
                  className={cn(
                    "px-3 py-2 cursor-pointer flex items-center gap-2 text-sm",
                    isSelected && "bg-blue-50 text-blue-700",
                    !isSelected && "hover:bg-gray-50"
                  )}
                >
                  <div className="flex-1 flex items-center gap-2">
                    {isRecent && (
                      <Star className="h-3 w-3 text-yellow-500 shrink-0" />
                    )}
                    <span
                      className="flex-1"
                      dangerouslySetInnerHTML={{ 
                        __html: match.highlightedName || match.item.name 
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {isRecent && (
                      <Badge variant="secondary" className="text-xs">
                        {locale === 'he' ? 'אחרון' : 'Recent'}
                      </Badge>
                    )}
                    {match.score > 70 && inputValue.trim() && (
                      <Badge variant="outline" className="text-xs">
                        {locale === 'he' ? 'מדויק' : 'Exact'}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Helper text */}
      {showSuggestions && inputValue && autocompleteMatches.length === 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {allowCustomInput 
            ? (locale === 'he' ? 'לחץ Enter להוספת גזע חדש' : 'Press Enter to add custom breed')
            : (locale === 'he' ? 'לא נמצאו גזעים התואמים' : 'No matching breeds found')
          }
        </div>
      )}
    </div>
  );
}
