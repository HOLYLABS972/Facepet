'use client';

import { redirect } from '@/src/i18n/routing';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';

export default function PetLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();

  // Basic validation for pet ID (Firebase document ID format)
  // Firebase document IDs can be 1-1500 characters and contain alphanumeric characters, hyphens, and underscores
  if (!id || id.length < 1 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    redirect({ href: '/', locale });
    return;
  }

  return <>{children}</>;
}
