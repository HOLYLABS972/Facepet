// components/pages/my-pets/MyPetsClient.tsx
'use client';

import MyPetCard from '@/components/MyPetCard';
import { EditIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import InviteFriendsCard from './InviteFriendsCard';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface Pet {
  id: string;
  name: string;
  breed: string;
  image: string;
}

interface MyPetsClientProps {
  pets: Pet[];
}

const MyPetsClient: React.FC<MyPetsClientProps> = ({ pets }) => {
  const t = useTranslations('pages.MyPetsPage');
  const [search, setSearch] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const filteredPets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button
          variant={isEditMode ? 'default' : 'ghost'}
          className="h-9 w-9"
          onClick={() => setIsEditMode(!isEditMode)}
        >
          <EditIcon
            className={cn('h-6 w-6', isEditMode ? '' : 'text-gray-400')}
          />
        </Button>
      </div>

      <div className="mb-4">
        <InviteFriendsCard />
      </div>

      <Separator className="mb-4 h-0.5" />

      {/* Pet Cards */}
      {filteredPets.length === 0 ? (
        <p>{t('noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredPets.map((pet) => (
            <MyPetCard
              key={pet.id}
              id={pet.id}
              name={pet.name}
              breed={pet.breed}
              image={pet.image}
              isEditMode={isEditMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPetsClient;
