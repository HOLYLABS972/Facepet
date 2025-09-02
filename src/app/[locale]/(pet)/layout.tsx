'use client';

import { redirect } from '@/src/i18n/routing';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { validate as isValidUUID } from 'uuid';

export default function PetLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();

  // Invalid pet ID format
  if (!isValidUUID(id)) {
    redirect({ href: '/', locale });
    return;
  }

  return <>{children}</>;
}
