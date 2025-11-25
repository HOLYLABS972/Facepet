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
import { Audience } from '@/types/promo';

interface AudienceMultiselectProps {
  audiences: Audience[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AudienceMultiselect({
  audiences,
  selectedIds,
  onSelectionChange,
  placeholder = 'Select audiences...',
  className,
  disabled = false
}: AudienceMultiselectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter audiences based on search query
  const filteredAudiences = useMemo(() => {
    if (!searchQuery) return audiences;
    
    const query = searchQuery.toLowerCase();
    return audiences.filter(audience =>
      audience.name.toLowerCase().includes(query) ||
      audience.description.toLowerCase().includes(query)
    );
  }, [audiences, searchQuery]);

  const selectedAudiences = useMemo(() => {
    return audiences.filter(audience => selectedIds.includes(audience.id));
  }, [audiences, selectedIds]);

  const toggleAudience = (audienceId: string) => {
    if (selectedIds.includes(audienceId)) {
      onSelectionChange(selectedIds.filter(id => id !== audienceId));
    } else {
      onSelectionChange([...selectedIds, audienceId]);
    }
  };

  const removeAudience = (audienceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectionChange(selectedIds.filter(id => id !== audienceId));
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
            {selectedAudiences.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              selectedAudiences.map((audience) => (
                <Badge
                  key={audience.id}
                  variant="secondary"
                  className="mr-1 mb-1 cursor-pointer"
                  onClick={(e) => removeAudience(audience.id, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {audience.name}
                  <button
                    type="button"
                    className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                    onClick={(e) => removeAudience(audience.id, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <X className="h-3 w-3" />
                  </button>
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
            placeholder="Search audiences..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No audiences found.</CommandEmpty>
            <CommandGroup>
              {filteredAudiences.map((audience) => {
                const isSelected = selectedIds.includes(audience.id);
                return (
                  <CommandItem
                    key={audience.id}
                    value={audience.id}
                    onSelect={() => toggleAudience(audience.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1">{audience.name}</span>
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

