'use client';

import { useTranslations } from 'next-intl';

const page = () => {
  const t = useTranslations('pages.TooFastPage');

  return (
    <>
      <h1 className="text-primary text-3xl font-bold">{t('title')}</h1>
      <p className="text-base text-gray-500">{t('subtitle')}</p>
    </>
  );
};

export default page;
