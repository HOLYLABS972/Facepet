'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormEvent, useState } from 'react';

interface SearchFormProps {
  searchQuery: string;
  sortField: string;
  sortOrder: string;
  placeholder?: string;
}

export default function SearchForm({
  searchQuery,
  sortField,
  sortOrder,
  placeholder = 'Search...'
}: SearchFormProps) {
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('page', '1'); // Reset to page 1 when searching
    if (searchTerm) params.set('search', searchTerm);
    if (sortField) params.set('sort', sortField);
    if (sortOrder) params.set('order', sortOrder);
    window.location.href = `?${params.toString()}`;
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}
