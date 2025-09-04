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
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useMemo, useState } from 'react';

interface GetStartedComboSelectProps {
  label: string;
  id: string;
  value?: number;
  required?: boolean;
  selectOptions: { id: number; label: string }[];
  hasError?: boolean;
  errorMessage?: string;
  onChange: (value: number) => void;
  onBlur?: () => void;
}

const GetStartedComboSelect: React.FC<GetStartedComboSelectProps> = ({
  label,
  id,
  value,
  required = false,
  selectOptions,
  hasError = false,
  onChange,
  onBlur
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  // New state to control popover open state
  const [open, setOpen] = useState(false);
  const t = useTranslations('components.searchbar');

  // Filter options based on the search query.
  const filteredOptions = useMemo(
    () =>
      searchQuery
        ? selectOptions.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : selectOptions,
    [selectOptions, searchQuery]
  );

  return (
    <div className="relative w-full">
      {/* Label */}
      <label
        htmlFor={id}
        className={cn(
          'absolute top-2.5 left-3 w-fit text-sm text-gray-500 transition-all duration-200 ease-in-out rtl:right-3',
          value && value > 0
            ? 'text-primary -top-6 text-sm font-medium'
            : 'top-2.5 text-gray-500',
          hasError ? 'text-red-800' : ''
        )}
        onBlur={onBlur}
      >
        {label}
        {required ? '*' : ''}
      </label>

      {/* Combobox Popover */}
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
            <span className="font-normal">
              {selectOptions.find((option) => option.id === (value || 0))?.label || ''}
            </span>
            <ChevronDown className="h-4! w-4! opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            {/* Search Input */}
            <CommandInput
              placeholder={t('search')}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {filteredOptions.length > 0 ? (
                // Wrap the CommandGroup with a scrollable container.
                <ScrollArea className="max-h-44 overflow-y-auto">
                  <CommandGroup>
                    {filteredOptions.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={option.label}
                        onSelect={() => {
                          onChange(option.id);
                          setSearchQuery('');
                          setOpen(false); // Close the popover on select
                        }}
                      >
                        {option.label}
                        <div className="grow" />
                        <Check
                          className={cn(
                            'ml-auto',
                            option.id === value ? 'opacity-100' : 'opacity-0'
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

export default GetStartedComboSelect;
