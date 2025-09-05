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
  value?: string;
  required?: boolean;
  selectOptions: { value: string; label: string }[];
  hasError?: boolean;
  errorMessage?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
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
          value && value.length > 0
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
        value={value || ''}
        onValueChange={(newValue) => onChange(newValue)}
      >
        <SelectTrigger
          id={id}
          className={cn(
            'h-10 border-gray-300 bg-white text-base',
            hasError ? 'border-red-800' : ''
          )}
        >
                  <SelectValue className="rtl:text-right">
          {selectOptions.find((option) => option.value === value)?.label || ''}
        </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {selectOptions
            .filter((option) => option.value && option.label) // Filter out undefined values
            .map((option, index) => (
              <SelectItem key={option.value || `option-${index}`} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GetStartedSelect;
