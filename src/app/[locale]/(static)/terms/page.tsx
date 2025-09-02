'use client';

import { usePetId } from '@/src/hooks/use-pet-id';
import { useTranslations } from 'next-intl';

const page = () => {
  const t = useTranslations('pages.TermsAndConditionsPage');
  const { petId, clearPetId } = usePetId();

  if (petId) {
    clearPetId();
  }

  return (
    <>
      <h1 className="text-primary text-3xl font-bold">{t('title')}</h1>
      <p className="text-base text-gray-500">{t('subtitle')}</p>
    </>
  );
};

export default page;
