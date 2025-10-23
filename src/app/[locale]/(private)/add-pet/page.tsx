'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function AddPetRedirect() {
  const router = useRouter();
  const t = useTranslations('pages.AddPetPage');

  useEffect(() => {
    // Generate a unique pet ID
    const generatePetId = () => {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substr(2, 9);
      return 'pet' + timestamp + random;
    };

    // Generate pet ID and redirect to register
    const petId = generatePetId();
    router.push(`/pet/${petId}/get-started/register`);
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('redirecting')}</p>
      </div>
    </div>
  );
}
