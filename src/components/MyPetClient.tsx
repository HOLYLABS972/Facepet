// components/pages/my-pets/MyPetsClient.tsx
'use client';

import MyPetCard from '@/components/MyPetCard';
import { EditIcon, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import InviteFriendsCard from './InviteFriendsCard';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { getUserPets } from '@/lib/actions/pets';

interface Pet {
  id: string;
  name: string;
  breed: string;
  image: string;
}

interface MyPetsClientProps {
  pets: Pet[];
}

const MyPetsClient: React.FC<MyPetsClientProps> = ({ pets: initialPets }) => {
  const t = useTranslations('pages.MyPetsPage');
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [pets, setPets] = useState(initialPets);
  const [petsLoading, setPetsLoading] = useState(false);

  // Fetch pets when user is authenticated
  useEffect(() => {
    const fetchPets = async () => {
      if (user?.email && !loading) {
        setPetsLoading(true);
        try {
          const result = await getUserPets(user.email);
          
          if (result.success && result.pets) {
            // Transform the database pets to match the expected interface
            const transformedPets = result.pets.map(pet => ({
              id: pet.id,
              name: pet.name,
              breed: pet.breedName || 'Unknown',
              image: pet.imageUrl || '/default-pet.png'
            }));
            setPets(transformedPets);
          } else {
            console.error('Error fetching pets:', result.error);
          }
        } catch (error) {
          console.error('Error fetching pets:', error);
        } finally {
          setPetsLoading(false);
        }
      }
    };

    fetchPets();
  }, [user?.email, loading]);

  const filteredPets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-6">
        <div className="text-center">
          <h1 className="text-primary py-2 font-['Lobster'] text-3xl tracking-wide lg:text-4xl">
            {t('welcomeBack')}
          </h1>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold text-gray-900">{user?.displayName || user?.email}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <p className="text-base text-gray-600">
            {t('managePetsDescription')}
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
      {petsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">{t('loadingPets')}</span>
        </div>
      ) : filteredPets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">{t('noResults')}</p>
          <p className="text-sm text-gray-500">
            {t('addFirstPet')}
          </p>
        </div>
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
