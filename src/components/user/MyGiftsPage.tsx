// components/pages/my-pets/MyGiftsPage.tsx
'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import GiftCard from '../GiftCard';

interface Pet {
  id: string;
  name: string;
  breed: string;
  image: string;
}

interface MyGiftsPageProps {
  pets: Pet[];
}

const MyGiftsPage: React.FC<MyGiftsPageProps> = ({ pets }) => {
  const t = useTranslations('pages.MyGiftsPage');

  return (
    <div>
      <h1 className="mb-6 gap-2 text-2xl font-bold">{t('title')}</h1>
      {/* {filteredPets.length === 0 ? (
        <p>{t('noResults')}</p>
      ) : ( */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <GiftCard
          id={''}
          value={50}
          valueText="שקלים"
          title={'מתנת הצטרפות!'}
          description="ארנק קניה למזון אקאנה לכלב/חתול"
        />
      </div>
      {/* )} */}
    </div>
  );
};

export default MyGiftsPage;
