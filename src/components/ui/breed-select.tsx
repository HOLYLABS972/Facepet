'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Filter, Clock, Star } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/src/lib/utils';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { Badge } from './badge';
import { getLocalizedBreedsForType, type PetType } from '@/src/lib/data/breeds';
import { HebrewAlphabetFilter, HebrewLetterRangeSelector } from './hebrew-alphabet-filter';
import { sortHebrewStrings, compareHebrew } from '@/src/lib/utils/hebrew-sort';
import { 
  fuzzySearch, 
  getSuggestions, 
  RecentSelectionsManager, 
  debounce,
  type AutocompleteItem,
  type AutocompleteMatch 
} from '@/src/lib/utils/autocomplete';

interface BreedSelectProps {
  petType: PetType;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  hasError?: boolean;
  disabled?: boolean;
}

export function BreedSelect({
  petType,
  value,
  onValueChange,
  placeholder,
  className,
  label,
  required = false,
  hasError = false,
  disabled = false
}: BreedSelectProps) {
  const t = useTranslations('Pet.add.form.breed');
  const locale = useLocale() as 'en' | 'he';
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showHebrewFilter, setShowHebrewFilter] = useState(false);
  const [hebrewFilteredBreeds, setHebrewFilteredBreeds] = useState<Array<{ id: string; name: string }>>([]);
  const [autocompleteMatches, setAutocompleteMatches] = useState<AutocompleteMatch[]>([]);
  const [recentSelections, setRecentSelections] = useState<string[]>([]);

  // Initialize recent selections manager
  const recentManager = useMemo(() => 
    new RecentSelectionsManager(`breed-recent-${petType}-${locale}`, 5), 
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
  
  // Use Hebrew filtered breeds if Hebrew filter is active, otherwise use all breeds
  const breedsToFilter = hebrewFilteredBreeds.length > 0 ? hebrewFilteredBreeds : breeds;
  
  // Convert breeds to autocomplete items
  const autocompleteItems: AutocompleteItem[] = useMemo(() => 
    breedsToFilter.map(breed => ({
      id: breed.id,
      name: breed.name,
      ...breed
    })), 
    [breedsToFilter]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      const matches = getSuggestions(query, autocompleteItems, recentSelections, {
        limit: 15,
        includeRecent: true,
        minScore: query.trim() ? 1 : 0  // Lower minimum score for better multi-word and Hebrew matching
      });
      setAutocompleteMatches(matches);
    }, 150),
    [autocompleteItems, recentSelections]
  );

  // Update search results when search value changes
  useEffect(() => {
    debouncedSearch(searchValue);
  }, [searchValue, debouncedSearch]);

  // Initialize matches when component mounts or breeds change
  useEffect(() => {
    if (autocompleteItems.length > 0) {
      const initialMatches = getSuggestions('', autocompleteItems, recentSelections, {
        limit: 15,
        includeRecent: true,
        minScore: 0
      });
      setAutocompleteMatches(initialMatches);
    }
  }, [autocompleteItems, recentSelections]);

  const filteredBreeds = useMemo(() => {
    return autocompleteMatches.map(match => ({
      ...match.item,
      highlightedName: match.highlightedName,
      score: match.score,
      isRecent: recentSelections.includes(match.item.id)
    }));
  }, [autocompleteMatches, recentSelections]);

  const selectedBreed = breeds.find(breed => breed.id === value);

  return (
    <div className="relative w-full" translate="no">
      {label && (
        <label
          className={cn(
            'absolute top-2.5 left-3 w-fit text-sm text-gray-500 transition-all duration-200 ease-in-out rtl:right-3',
            value && value.length > 0
              ? 'text-primary -top-6 text-sm font-medium'
              : 'top-2.5 text-gray-500',
            hasError ? 'text-red-800' : ''
          )}
          translate="no"
        >
          {label}
          {required ? '*' : ''}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            translate="no"
            className={cn("h-10 border-gray-300 bg-white text-sm w-full justify-between", className, disabled && "opacity-50 cursor-not-allowed")}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <span className={cn(
              "flex-1 text-left rtl:text-right",
              !selectedBreed && !disabled ? "text-gray-500" : ""
            )}>
              {selectedBreed ? selectedBreed.name : (disabled ? '' : (placeholder || t('placeholder')))}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder={t('searchPlaceholder')}
                value={searchValue}
                onValueChange={setSearchValue}
                onKeyDown={(e) => {
                  // Enhanced keyboard navigation
                  if (e.key === 'Escape') {
                    setSearchValue('');
                    setShowHebrewFilter(false);
                    setHebrewFilteredBreeds([]);
                  }
                  if (e.key === 'Enter' && filteredBreeds.length === 1) {
                    // Auto-select if only one match
                    const breed = filteredBreeds[0];
                    onValueChange(breed.id);
                    recentManager.addRecent(breed.id);
                    setRecentSelections(recentManager.getRecent());
                    setOpen(false);
                    setSearchValue('');
                    setShowHebrewFilter(false);
                    setHebrewFilteredBreeds([]);
                    e.preventDefault();
                  }
                }}
                className="flex-1"
              />
              {locale === 'he' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHebrewFilter(!showHebrewFilter)}
                  className={cn(
                    "ml-2 h-8 w-8 p-0",
                    showHebrewFilter && "bg-blue-100 text-blue-700"
                  )}
                  title={locale === 'he' ? 'סינון עברי' : 'Hebrew Filter'}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              )}
              {searchValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchValue('');
                    setShowHebrewFilter(false);
                    setHebrewFilteredBreeds([]);
                  }}
                  className="ml-1 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  title={locale === 'he' ? 'נקה חיפוש' : 'Clear search'}
                >
                  ×
                </Button>
              )}
            </div>
            
            {locale === 'he' && showHebrewFilter && (
              <div className="p-3 border-b bg-gray-50">
                <HebrewAlphabetFilter
                  items={breeds}
                  onFilterChange={(filtered) => {
                    setHebrewFilteredBreeds(filtered);
                  }}
                  className="mb-3"
                />
                <HebrewLetterRangeSelector
                  items={breeds}
                  onFilterChange={(filtered) => {
                    setHebrewFilteredBreeds(filtered);
                  }}
                />
              </div>
            )}
            
            <CommandList>
              <CommandEmpty>{t('noBreedFound')}</CommandEmpty>
              
              {/* Recent selections group */}
              {recentSelections.length > 0 && !searchValue.trim() && (
                <CommandGroup heading={
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {locale === 'he' ? 'נבחרו לאחרונה' : 'Recently Selected'}
                  </div>
                }>
                  {filteredBreeds
                    .filter(breed => breed.isRecent)
                    .slice(0, 3)
                    .map((breed) => (
                      <CommandItem
                        key={`recent-${breed.id}`}
                        value={breed.id}
                        onSelect={(currentValue) => {
                          onValueChange(currentValue === value ? "" : currentValue);
                          recentManager.addRecent(currentValue);
                          setRecentSelections(recentManager.getRecent());
                          setOpen(false);
                          setSearchValue('');
                          setShowHebrewFilter(false);
                          setHebrewFilteredBreeds([]);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            value === breed.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 flex items-center gap-2">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span 
                            dangerouslySetInnerHTML={{ 
                              __html: breed.highlightedName || breed.name 
                            }}
                          />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {locale === 'he' ? 'אחרון' : 'Recent'}
                        </Badge>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
              
              {/* All breeds group */}
              <CommandGroup heading={
                searchValue.trim() ? (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {locale === 'he' ? 'תוצאות חיפוש' : 'Search Results'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {filteredBreeds.length}
                    </Badge>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    {locale === 'he' ? 'כל הגזעים' : 'All Breeds'}
                  </div>
                )
              }>
                {filteredBreeds
                  .filter(breed => !searchValue.trim() || !breed.isRecent)
                  .map((breed) => (
                    <CommandItem
                      key={breed.id}
                      value={breed.id}
                      onSelect={(currentValue) => {
                        onValueChange(currentValue === value ? "" : currentValue);
                        recentManager.addRecent(currentValue);
                        setRecentSelections(recentManager.getRecent());
                        setOpen(false);
                        setSearchValue('');
                        setShowHebrewFilter(false);
                        setHebrewFilteredBreeds([]);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === breed.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 flex items-center gap-2">
                        {breed.isRecent && !searchValue.trim() && (
                          <Star className="h-3 w-3 text-yellow-500" />
                        )}
                        <span 
                          className="flex-1"
                          dangerouslySetInnerHTML={{ 
                            __html: breed.highlightedName || breed.name 
                          }}
                        />
                      </div>
                      {searchValue.trim() && breed.score > 70 && (
                        <Badge variant="secondary" className="text-xs">
                          {locale === 'he' ? 'התאמה מדויקת' : 'Exact'}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
