'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { LockIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

interface PrivacyToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const PrivacyToggle: React.FC<PrivacyToggleProps> = ({
  id,
  label,
  checked,
  onChange,
  className
}) => {
  const t = useTranslations('components.PrivacyToggle');

  return (
    <div className={cn('flex items-center space-x-2 rtl:space-x-reverse', className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="border-primary data-[state=checked]:bg-primary"
      />
      <div className="flex items-center gap-1.5">
        <Label
          htmlFor={id}
          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </Label>
        <LockIcon className="h-3.5 w-3.5 text-gray-500" />
      </div>
    </div>
  );
};

export default PrivacyToggle;
