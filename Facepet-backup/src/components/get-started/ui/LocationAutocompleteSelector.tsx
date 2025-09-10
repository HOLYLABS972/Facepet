'use client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { autocomplete, getPlaceFormattedAddress } from '@/lib/google'; // your autocomplete function
import { cn } from '@/lib/utils';
import {
  Language,
  PlaceAutocompleteResult
} from '@googlemaps/google-maps-services-js';
import { Check, ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

interface LocationAutocompleteComboSelectProps {
  label: string;
  id: string;
  value: string; // store the selected place_id
  required?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const LocationAutocompleteComboSelect: React.FC<
  LocationAutocompleteComboSelectProps
> = ({
  label,
  id,
  value,
  required = false,
  hasError = false,
  errorMessage,
  onChange,
  onBlur
}) => {
  const t = useTranslations('components.searchbar');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlaceAutocompleteResult[]>([]);
  // This state holds the description that will be displayed on the button.
  const [displayValue, setDisplayValue] = useState('');
  const locale = useLocale();

  // When the user types a query, fetch autocomplete predictions.
  useEffect(() => {
    const fetchPredictions = async () => {
      if (!searchQuery) {
        setPredictions([]);
        return;
      }
      const preds = await autocomplete(searchQuery, locale as Language);
      setPredictions(preds ?? []);
    };
    fetchPredictions();
  }, [searchQuery]);

  // When a place_id is provided (via props.value), fetch its details to get a description.
  useEffect(() => {
    const fetchPlaceDescription = async () => {
      if (value) {
        try {
          const formatted_address = await getPlaceFormattedAddress(
            value,
            locale as Language
          );

          if (formatted_address) {
            setDisplayValue(formatted_address);
          }
        } catch (error) {
          console.error('Error fetching place details:', error);
        }
      }
    };

    fetchPlaceDescription();
  }, [value]);

  return (
    <div className="relative w-full">
      {/* Label */}
      <label
        htmlFor={id}
        className={cn(
          'absolute top-2.5 left-3 text-sm text-gray-500 transition-all duration-200 ease-in-out rtl:right-3',
          value
            ? 'text-primary -top-6 text-sm font-medium'
            : 'top-2.5 text-gray-500',
          hasError ? 'text-red-800' : ''
        )}
        onBlur={onBlur}
      >
        {label}
        {required ? '*' : ''}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={id}
            className={cn(
              'hover:ouline-none hover:ring-ring h-10 w-full justify-between border-gray-300 bg-white px-3 text-base hover:bg-white hover:ring-1',
              hasError ? 'border-red-800' : ''
            )}
            onClick={() => setOpen(true)}
          >
            <span className="overflow-x-scroll font-normal">
              {displayValue}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder={t('search')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {predictions.length > 0 ? (
                <ScrollArea className="max-h-44 overflow-y-auto">
                  <CommandGroup>
                    {predictions.map((prediction) => (
                      <CommandItem
                        key={prediction.place_id}
                        value={prediction.description}
                        onSelect={() => {
                          // When a prediction is selected:
                          // - update the button display with the description
                          // - send the place_id to the parent via onChange
                          // - clear the search query and predictions
                          setDisplayValue(prediction.description);
                          onChange(prediction.place_id);
                          setSearchQuery('');
                          setOpen(false);
                        }}
                      >
                        {prediction.description}
                        <div className="grow" />
                        <Check
                          className={cn(
                            'ml-auto',
                            prediction.place_id === value
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                          size={16}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </ScrollArea>
              ) : (
                <CommandEmpty>{t('noResult')}</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LocationAutocompleteComboSelect;
