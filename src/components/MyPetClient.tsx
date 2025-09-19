// components/pages/my-pets/MyPetClient.tsx
'use client';

import MyPetCard from '@/components/MyPetCard';
import { EditIcon } from 'lucide-react';
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
import { getBreedNameFromId, convertBreedSlugToName } from '@/src/lib/firebase/breed-utils';
import { useLocale } from 'next-intl';

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
  const locale = useLocale() as 'en' | 'he';
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
          console.log('Query snapshot size:', querySnapshot.size); // Debug log
          console.log('User email:', user.email); // Debug log
          
          if (!querySnapshot.empty) {
            const petsData = await Promise.all(querySnapshot.docs.map(async doc => {
              const data = doc.data();
              console.log('Pet data:', data); // Debug log
              
              // Try different breed field names and formats
              let breedId = data.breedId || data.breed || data.breedName || '';
              let localizedBreed = 'Unknown Breed';
              
              // If breedId is a number, convert to string
              if (typeof breedId === 'number') {
                breedId = breedId.toString();
              }
              
              // If breedId is a slug format, try to convert it
              if (breedId && breedId.includes('-')) {
                localizedBreed = convertBreedSlugToName(breedId, locale);
              } else if (breedId) {
                localizedBreed = getBreedNameFromId(breedId, locale);
              }
              
              console.log('Breed ID:', breedId, 'Localized breed:', localizedBreed); // Debug log
              
              return {
                id: doc.id,
                name: data.name || 'Unknown Pet',
                breed: localizedBreed,
                image: data.imageUrl || '/default-pet.png'
              };
            }));
            console.log('Processed pets data:', petsData); // Debug log
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
        {filteredPets.length > 0 && (
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
        )}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('noPetsYet')}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            {t('scanToAddPet')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
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

      {/* Floating Action Button - Removed to force pet creation only through scanning */}
    </div>
  );
};

export default MyPetClient;