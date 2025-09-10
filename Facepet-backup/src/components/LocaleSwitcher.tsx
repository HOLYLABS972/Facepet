'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import React from 'react';

const LocaleSwitcher: React.FC = () => {
  const router = useRouter();
  const currentLocale = useLocale();

  const handleLocaleChange = (newLocale: string) => {
    localStorage.setItem('preferredLocale', newLocale);
    router.push(`/${newLocale}`);
  };

  return (
    <Select value={currentLocale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Select Locale" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">🇺🇸 English</SelectItem>
        <SelectItem value="he">🇮🇱 עברית</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LocaleSwitcher;
