'use client';

import { redirect } from '@/src/i18n/routing';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';

export default function PetLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();

  // Basic validation for pet ID (Firebase document ID format)
  // Firebase document IDs are typically 20 characters long and contain alphanumeric characters
  if (!id || id.length < 10 || !/^[a-zA-Z0-9]+$/.test(id)) {
    redirect({ href: '/', locale });
    return;
  }

  return <>{children}</>;
}
