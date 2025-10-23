'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import { getLocalizedBreedsForType, type PetType } from '@/src/lib/data/breeds';

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

  const breeds = useMemo(() => {
    try {
      return getLocalizedBreedsForType(petType, locale);
    } catch (error) {
      console.error('Error getting breeds for type:', petType, error);
      return [];
    }
  }, [petType, locale]);
  
  const filteredBreeds = useMemo(() => {
    if (!searchValue) return breeds;
    return breeds.filter(breed =>
      breed.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [breeds, searchValue]);

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
            <CommandInput
              placeholder={t('searchPlaceholder')}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>{t('noBreedFound')}</CommandEmpty>
              <CommandGroup>
                {filteredBreeds.map((breed) => (
                  <CommandItem
                    key={breed.id}
                    value={breed.id}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setSearchValue('');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === breed.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {breed.name}
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
