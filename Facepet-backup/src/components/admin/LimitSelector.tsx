'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface LimitSelectorProps {
  currentLimit: number;
  baseUrl: string;
  searchParams: Record<string, string>;
}

export function LimitSelector({
  currentLimit,
  baseUrl,
  searchParams
}: LimitSelectorProps) {
  const router = useRouter();

  const handleLimitChange = (value: string) => {
    const params = new URLSearchParams();

    // Add all existing search params except page and limit
    for (const [key, val] of Object.entries(searchParams)) {
      if (key !== 'page' && key !== 'limit') {
        params.set(key, val);
      }
    }

    // Set the new limit and reset to page 1
    params.set('limit', value);
    params.set('page', '1');

    // Navigate to the new URL
    router.push(`${baseUrl}?${params.toString()}`);
  };

  return (
    <Select
      defaultValue={currentLimit.toString()}
      onValueChange={handleLimitChange}
    >
      <SelectTrigger className="w-[120px] bg-white">
        <SelectValue placeholder="10 per page" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="5">5 per page</SelectItem>
        <SelectItem value="10">10 per page</SelectItem>
        <SelectItem value="20">20 per page</SelectItem>
        <SelectItem value="50">50 per page</SelectItem>
      </SelectContent>
    </Select>
  );
}
