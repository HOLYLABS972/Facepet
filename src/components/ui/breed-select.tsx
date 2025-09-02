'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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
import { getBreedsForType, type PetType, type Breed } from '@/src/lib/data/breeds';

interface BreedSelectProps {
  petType: PetType;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function BreedSelect({
  petType,
  value,
  onValueChange,
  placeholder = "Select breed...",
  className
}: BreedSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const breeds = useMemo(() => getBreedsForType(petType), [petType]);
  
  const filteredBreeds = useMemo(() => {
    if (!searchValue) return breeds;
    return breeds.filter(breed =>
      breed.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [breeds, searchValue]);

  const selectedBreed = breeds.find(breed => breed.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedBreed ? selectedBreed.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search breeds..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
          </div>
          <CommandList>
            <CommandEmpty>No breed found.</CommandEmpty>
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
  );
}
