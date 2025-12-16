'use client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

interface TagsFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  clearAllText?: string;
  searchTagsPlaceholder?: string;
  tagsSelectedText?: string;
  tagsSelectedPluralText?: string;
  selectedText?: string;
  noTagsFoundText?: string;
  className?: string;
  translateTag?: (tag: string) => string; // Function to translate tags for display
}

export function TagsFilter({ 
  tags, 
  selectedTags, 
  onTagsChange, 
  placeholder = "Filter by tags...",
  clearAllText = "Clear all",
  searchTagsPlaceholder = "Search tags...",
  tagsSelectedText = "{count} tag selected",
  tagsSelectedPluralText = "{count} tags selected",
  selectedText = "Selected",
  noTagsFoundText = "No tags found.",
  className,
  translateTag
}: TagsFilterProps) {
  const [open, setOpen] = useState(false);

  // Helper function to get display text for a tag
  const getTagDisplay = (tag: string) => {
    return translateTag ? translateTag(tag) : tag;
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Tags dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedTags.length > 0 
              ? (selectedTags.length === 1 
                  ? tagsSelectedText.replace('{count}', selectedTags.length.toString())
                  : tagsSelectedPluralText.replace('{count}', selectedTags.length.toString()))
              : placeholder
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4} avoidCollisions={false}>
          <Command>
            <CommandInput placeholder={searchTagsPlaceholder} />
            <CommandList>
              <CommandEmpty>{noTagsFoundText}</CommandEmpty>
              {selectedTags.length > 0 && (
                <CommandGroup>
                  <CommandItem
                    onSelect={clearAllTags}
                    className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="mr-2 h-4 w-4" />
                    {clearAllText}
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandGroup>
                {tags.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={translateTag ? getTagDisplay(tag) : tag}
                    onSelect={() => handleTagToggle(tag)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedTags.includes(tag) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {getTagDisplay(tag)}
                    </div>
                    {selectedTags.includes(tag) && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedText}
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
