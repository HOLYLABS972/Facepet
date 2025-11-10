'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedBreedsForType, type PetType } from '@/src/lib/data/breeds';
import { HebrewAlphabetFilter, HebrewLetterRangeSelector } from './hebrew-alphabet-filter';
import { compareHebrew } from '@/src/lib/utils/hebrew-sort';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

interface HebrewBreedFilterProps {
  petType: PetType;
  onBreedsFiltered?: (breeds: Array<{ id: string; name: string }>) => void;
  className?: string;
  showResults?: boolean;
}

export function HebrewBreedFilter({
  petType,
  onBreedsFiltered,
  className,
  showResults = true
}: HebrewBreedFilterProps) {
  const t = useTranslations('Pet.add.form.breed');
  const locale = useLocale() as 'en' | 'he';
  const [filteredBreeds, setFilteredBreeds] = useState<Array<{ id: string; name: string }>>([]);
  const [activeFilter, setActiveFilter] = useState<'alphabet' | 'range'>('alphabet');

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

  const handleFilterChange = (filtered: Array<{ id: string; name: string }>) => {
    setFilteredBreeds(filtered);
    onBreedsFiltered?.(filtered);
  };

  // Only show Hebrew filter for Hebrew locale
  if (locale !== 'he') {
    return null;
  }

  const displayBreeds = filteredBreeds.length > 0 ? filteredBreeds : breeds;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">
          סינון גזעים לפי אלפבית עברי
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as 'alphabet' | 'range')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alphabet">סינון לפי אות</TabsTrigger>
            <TabsTrigger value="range">סינון לפי טווח</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alphabet" className="mt-4">
            <HebrewAlphabetFilter
              items={breeds}
              onFilterChange={handleFilterChange}
            />
          </TabsContent>
          
          <TabsContent value="range" className="mt-4">
            <HebrewLetterRangeSelector
              items={breeds}
              onFilterChange={handleFilterChange}
            />
          </TabsContent>
        </Tabs>

        {showResults && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">
                תוצאות ({displayBreeds.length} גזעים)
              </h4>
              {filteredBreeds.length > 0 && (
                <Badge variant="secondary">
                  מסונן
                </Badge>
              )}
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
              <div className="grid grid-cols-1 gap-1">
                {displayBreeds.map((breed) => (
                  <div
                    key={breed.id}
                    className="p-2 text-sm hover:bg-gray-50 rounded border-b last:border-b-0"
                  >
                    {breed.name}
                  </div>
                ))}
              </div>
              
              {displayBreeds.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  לא נמצאו גזעים התואמים לסינון
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simplified version for inline use
interface InlineHebrewBreedFilterProps {
  petType: PetType;
  onBreedsFiltered?: (breeds: Array<{ id: string; name: string }>) => void;
  className?: string;
  filterType?: 'alphabet' | 'range' | 'both';
}

export function InlineHebrewBreedFilter({
  petType,
  onBreedsFiltered,
  className,
  filterType = 'both'
}: InlineHebrewBreedFilterProps) {
  const locale = useLocale() as 'en' | 'he';

  const breeds = useMemo(() => {
    try {
      const breedList = getLocalizedBreedsForType(petType, locale);
      if (locale === 'he') {
        return breedList.sort((a, b) => compareHebrew(a.name, b.name));
      }
      return breedList;
    } catch (error) {
      console.error('Error getting breeds for type:', petType, error);
      return [];
    }
  }, [petType, locale]);

  const handleFilterChange = (filtered: Array<{ id: string; name: string }>) => {
    onBreedsFiltered?.(filtered);
  };

  // Only show Hebrew filter for Hebrew locale
  if (locale !== 'he') {
    return null;
  }

  return (
    <div className={className}>
      {(filterType === 'alphabet' || filterType === 'both') && (
        <HebrewAlphabetFilter
          items={breeds}
          onFilterChange={handleFilterChange}
          className={filterType === 'both' ? 'mb-4' : ''}
        />
      )}
      
      {(filterType === 'range' || filterType === 'both') && (
        <HebrewLetterRangeSelector
          items={breeds}
          onFilterChange={handleFilterChange}
        />
      )}
    </div>
  );
}
