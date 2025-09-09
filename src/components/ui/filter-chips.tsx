'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import React from 'react';

export interface FilterChip {
  id: string;
  label: string;
  active: boolean;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onChipClick: (chipId: string) => void;
  className?: string;
}

export function FilterChips({ chips, onChipClick, className }: FilterChipsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant={chip.active ? 'default' : 'outline'}
          className={cn(
            'cursor-pointer transition-all duration-200 hover:scale-105',
            chip.active 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-primary/10 hover:text-primary'
          )}
          onClick={() => onChipClick(chip.id)}
        >
          {chip.label}
        </Badge>
      ))}
    </div>
  );
}
