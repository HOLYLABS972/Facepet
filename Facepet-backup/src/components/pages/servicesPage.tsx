'use client';

import { cn } from '@/src/lib/utils';
import { Search, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import ServiceCard from '../ServiceCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface Pet {
  id: string;
  name: string;
  breed: string;
  image: string;
}

interface ServicesPageProps {
  pets: Pet[];
}

const serviceMock = {
  location: 'תל אביב, ישראל',
  image:
    'https://lh5.googleusercontent.com/p/AF1QipMmS1RNeHcdzL9Q0vKO2r3pnSH6hoqZprlMTWOs',
  name: 'המרפאה הניידת',
  tags: ['וטרינר', 'טיפולים', 'חירום', 'חיסונים'],
  description:
    'שירות וטרינרי מקצועי עד הבית! המרפאה הניידת מספקת חיסונים, בדיקות, טיפולים רפואיים ושירותי חירום לכלבים וחתולים, עם יחס אישי ואכפתי לכל חיית מחמד.'
};

const serviceMockPetStore = {
  location: 'רמת גן, ישראל',
  image:
    'https://lh5.googleusercontent.com/p/AF1QipNMLfPdnEoY6h9buHgXaFKzOt7mNx-PXrt0ph8n',
  name: 'עולם החי - חנות חיות',
  tags: ['חיות מחמד', 'מזון וציוד', 'אקווריומים', 'חיות אקזוטיות'],
  description:
    'חנות חיות מקצועית עם מגוון רחב של מזון וציוד לכלבים, חתולים, ציפורים, דגים וחיות אקזוטיות. צוות מקצועי ומנוסה שיעזור לכם למצוא את המוצרים הטובים ביותר לחיית המחמד שלכם!'
};

const ServicesPage: React.FC<ServicesPageProps> = ({ pets }) => {
  const t = useTranslations('pages.ServicesPage');
  const [search, setSearch] = useState('');
  const [isFavoritesView, setFavoritesView] = useState(false);

  const filteredPets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">{t('title')}</h1>
      <div className="flex gap-2">
        <div className="relative mb-4 h-9 grow rounded-lg bg-white">
          <Search
            className="absolute top-1/2 -translate-y-1/2 transform text-gray-400 ltr:right-3 rtl:left-3"
            size={16}
          />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg p-2 pl-10"
          />
        </div>
        <Button
          variant={'ghost'}
          className="h-9 w-9 border bg-white shadow-sm"
          onClick={() => setFavoritesView(!isFavoritesView)}
        >
          <Star
            className={cn(
              'text-gray-400',
              isFavoritesView && 'fill-orange-400 text-orange-400'
            )}
          />
        </Button>
      </div>
      {/* {filteredPets.length === 0 ? (
        <p>{t('noResults')}</p>
      ) : ( */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* {filteredPets.map((pet) => ( */}
        <ServiceCard service={serviceMock} />
        <ServiceCard service={serviceMockPetStore} />
        {/* ))} */}
      </div>
      {/* )} */}
    </>
  );
};

export default ServicesPage;
