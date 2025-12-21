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
  label?: string;
}

export function FilterChips({ chips, onChipClick, className, label }: FilterChipsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant="outline"
          className={cn(
            'cursor-pointer transition-all duration-200 hover:scale-105',
            chip.active 
              ? 'bg-orange-500 text-white border-orange-500 shadow-md hover:bg-orange-600 [&]:bg-orange-500 [&]:text-white [&]:border-orange-500' 
              : 'hover:bg-orange-50 hover:text-orange-500 border-gray-300'
          )}
          style={chip.active ? { backgroundColor: '#f97316', color: '#ffffff', borderColor: '#f97316' } : undefined}
          onClick={() => onChipClick(chip.id)}
        >
          {chip.label}
        </Badge>
      ))}
    </div>
  );
}
