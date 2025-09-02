'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lock, Unlock } from 'lucide-react';
import React from 'react';

interface PrivacyLockToggleProps {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const PrivacyLockToggle: React.FC<PrivacyLockToggleProps> = ({
  isPrivate,
  onChange,
  disabled = false,
  className
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!isPrivate);
    }
  };

  return (
    <Button
      type="button"
      variant={'outline'}
      size="icon"
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        'h-10 w-10 rounded border-gray-300 bg-white',
        isPrivate ? 'text-primary' : 'text-gray-400',
        className
      )}
    >
      {isPrivate ? (
        <Lock className="h-4 w-4" />
      ) : (
        <Unlock className="h-4 w-4" />
      )}
    </Button>
  );
};

export default PrivacyLockToggle;
