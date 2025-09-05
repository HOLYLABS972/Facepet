// components/pages/my-pets/MyPetClient.tsx
'use client';

import MyPetCard from '@/components/MyPetCard';
import { EditIcon, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import InviteFriendsCard from './InviteFriendsCard';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useAuth } from '@/src/contexts/AuthContext';
import { db } from '@/src/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useRouter } from '@/i18n/routing';

interface Pet {
  id: string;
  name: string;
  breed: string;
  image: string;
}

interface MyPetClientProps {
  pets: Pet[];
}

const MyPetClient: React.FC<MyPetClientProps> = ({ pets: initialPets }) => {
  const t = useTranslations('pages.MyPetsPage');
  const { user, loading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [pets, setPets] = useState(initialPets);
  const [petsLoading, setPetsLoading] = useState(false);

  // Fetch pets when user is authenticated
  useEffect(() => {
    const fetchPets = async () => {
      if (user?.uid && !loading) {
        setPetsLoading(true);
        try {
          // Query Firestore directly for user's pets
          const petsRef = collection(db, 'pets');
          const q = query(
            petsRef, 
            where('userEmail', '==', user.email),
            orderBy('createdAt', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const petsData = querySnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || 'Unknown Pet',
                breed: data.breedName || data.breed || 'Unknown Breed',
                image: data.imageUrl || '/default-pet.png'
              };
            });
            setPets(petsData);
          } else {
            setPets([]);
          }
        } catch (error) {
          console.log('Error fetching pets from Firestore:', error);
          setPets([]);
        } finally {
          setPetsLoading(false);
        }
      }
    };

    fetchPets();
  }, [user?.uid, user?.email, loading]);

  const filteredPets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(search.toLowerCase())
  );

  // Generate a unique pet ID for the original registration flow
  // Must be at least 10 characters and contain only alphanumeric characters
  const generatePetId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9);
    return 'pet' + timestamp + random;
  };

  const handleAddPet = () => {
    const petId = generatePetId();
    router.push(`/pet/${petId}/get-started/register`);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-2">
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4">
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('noPetsYet')}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm">
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

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleAddPet}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg"
          title={t('addPet')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default MyPetClient;