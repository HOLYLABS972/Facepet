'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Business } from '@/types/promo';

interface BusinessMultiselectProps {
  businesses: Business[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function BusinessMultiselect({
  businesses,
  selectedIds,
  onSelectionChange,
  placeholder = 'Select businesses...',
  className,
  disabled = false
}: BusinessMultiselectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter businesses based on search query
  const filteredBusinesses = useMemo(() => {
    if (!searchQuery) return businesses;

    const query = searchQuery.toLowerCase();
    return businesses.filter(business =>
      business.name.toLowerCase().includes(query) ||
      business.description?.toLowerCase().includes(query)
    );
  }, [businesses, searchQuery]);

  const selectedBusinesses = useMemo(() => {
    return businesses.filter(business => selectedIds.includes(business.id));
  }, [businesses, selectedIds]);

  const toggleBusiness = (businessId: string) => {
    if (selectedIds.includes(businessId)) {
      onSelectionChange(selectedIds.filter(id => id !== businessId));
    } else {
      onSelectionChange([...selectedIds, businessId]);
    }
  };

  const removeBusiness = (businessId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectionChange(selectedIds.filter(id => id !== businessId));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-[42px] h-auto",
            !selectedIds.length && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedBusinesses.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              selectedBusinesses.map((business) => (
                <Badge
                  key={business.id}
                  variant="secondary"
                  className="mr-1 mb-1 cursor-pointer"
                  onClick={(e) => removeBusiness(business.id, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {business.name}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 rounded-full hover:bg-secondary-foreground/20 inline-flex items-center justify-center p-0.5"
                    onClick={(e) => removeBusiness(business.id, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        removeBusiness(business.id, e as any);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search businesses..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No businesses found.</CommandEmpty>
            <CommandGroup>
              {filteredBusinesses.map((business) => {
                const isSelected = selectedIds.includes(business.id);
                return (
                  <CommandItem
                    key={business.id}
                    value={business.id}
                    onSelect={() => toggleBusiness(business.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1">{business.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

