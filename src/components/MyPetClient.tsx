// components/pages/my-pets/MyPetsClient.tsx
'use client';

import MyPetCard from '@/components/MyPetCard';
import { EditIcon, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const filteredPets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-6">
        <div className="text-center">
          <h1 className="text-primary py-2 font-['Lobster'] text-3xl tracking-wide lg:text-4xl">
            Welcome back!
          </h1>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold text-gray-900">{session?.user?.name}</p>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
            </div>
          </div>

          <p className="text-base text-gray-600">
            Manage your pets and keep them safe with FacePet
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
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
