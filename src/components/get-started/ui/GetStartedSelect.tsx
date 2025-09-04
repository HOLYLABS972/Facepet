'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface GetStartedSelectProps {
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

const GetStartedSelect = ({
  label,
  id,
  value,
  required = false,
  selectOptions,
  hasError = false,
  errorMessage = '',
  onChange,
  onBlur
}: GetStartedSelectProps) => {
  const t = useTranslations('components.searchbar');

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

      {/* Select Component */}
      <Select
        value={value ? String(value) : ''}
        onValueChange={(newValue) => onChange(Number(newValue))}
      >
        <SelectTrigger
          id={id}
          className={cn(
            'h-10 border-gray-300 bg-white text-base',
            hasError ? 'border-red-800' : ''
          )}
        >
                  <SelectValue className="rtl:text-right">
          {selectOptions.find((option) => option.id === (value || 0))?.label || ''}
        </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {selectOptions.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.label || option.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GetStartedSelect;
