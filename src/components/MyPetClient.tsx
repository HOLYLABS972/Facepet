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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { getBreedNameFromId } from '@/src/lib/firebase/breed-utils';

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
          // Use the same method as the pet details page for consistency
          const { getPetWithConsolidatedOwner } = await import('@/src/lib/firebase/consolidated-pet-creation');
          
          // First get all pets for this user with a simple query
          const petsRef = collection(db, 'pets');
          const q = query(
            petsRef, 
            where('userEmail', '==', user.email)
          );
          
          const querySnapshot = await getDocs(q);
          console.log('Query snapshot size:', querySnapshot.size);
          console.log('User email:', user.email);
          
          if (!querySnapshot.empty) {
            // Use the same data fetching method as pet details page
            const petsData = await Promise.all(querySnapshot.docs.map(async doc => {
              try {
                // Use the same function that works for the details page
                const result = await getPetWithConsolidatedOwner(doc.id);
                
                if (result.success && result.pet) {
                  console.log('Pet data from consolidated method:', result.pet);
                  // Get breed name with proper translation
                  let breedDisplay = result.pet.breedName || result.pet.breed || 'Unknown Breed';
                  if (result.pet.breedId) {
                    breedDisplay = getBreedNameFromId(String(result.pet.breedId), locale as 'en' | 'he');
                  } else if (breedDisplay && breedDisplay !== 'Unknown Breed') {
                    // Try to find the breed in comprehensive data and translate it
                    const { breedsData } = await import('@/src/lib/data/comprehensive-breeds');
                    const breed = breedsData.find(b => 
                      b.en.toLowerCase() === breedDisplay.toLowerCase() || 
                      b.he === breedDisplay
                    );
                    if (breed) {
                      breedDisplay = locale === 'he' ? breed.he : breed.en;
                    }
                  }
                  
                  return {
                    id: result.pet.id,
                    name: result.pet.name || 'Unknown Pet',
                    breed: breedDisplay,
                    image: result.pet.imageUrl || '/default-pet.png'
                  };
                } else {
                  // Fallback to basic data if consolidated method fails
                  const data = doc.data();
                  // Get breed name with proper translation
                  let breedDisplay = data.breedName || data.breed || 'Unknown Breed';
                  if (data.breedId) {
                    breedDisplay = getBreedNameFromId(String(data.breedId), locale as 'en' | 'he');
                  } else if (breedDisplay && breedDisplay !== 'Unknown Breed') {
                    // Try to find the breed in comprehensive data and translate it
                    const { breedsData } = await import('@/src/lib/data/comprehensive-breeds');
                    const breed = breedsData.find(b => 
                      b.en.toLowerCase() === breedDisplay.toLowerCase() || 
                      b.he === breedDisplay
                    );
                    if (breed) {
                      breedDisplay = locale === 'he' ? breed.he : breed.en;
                    }
                  }
                  
                  return {
                    id: doc.id,
                    name: data.name || 'Unknown Pet',
                    breed: breedDisplay,
                    image: data.imageUrl || '/default-pet.png'
                  };
                }
              } catch (error) {
                console.error('Error fetching pet with consolidated method:', error);
                // Fallback to basic data
                const data = doc.data();
                // Get breed name with proper translation
                let breedDisplay = data.breedName || data.breed || 'Unknown Breed';
                if (data.breedId) {
                  breedDisplay = getBreedNameFromId(String(data.breedId), locale as 'en' | 'he');
                } else if (breedDisplay && breedDisplay !== 'Unknown Breed') {
                  // Try to find the breed in comprehensive data and translate it
                  const { breedsData } = await import('@/src/lib/data/comprehensive-breeds');
                  const breed = breedsData.find(b => 
                    b.en.toLowerCase() === breedDisplay.toLowerCase() || 
                    b.he === breedDisplay
                  );
                  if (breed) {
                    breedDisplay = locale === 'he' ? breed.he : breed.en;
                  }
                }
                
                return {
                  id: doc.id,
                  name: data.name || 'Unknown Pet',
                  breed: breedDisplay,
                  image: data.imageUrl || '/default-pet.png'
                };
              }
            }));
            
            console.log('Final processed pets data:', petsData);
            setPets(petsData);
          } else {
            setPets([]);
          }
        } catch (error) {
          console.error('Error fetching pets:', error);
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
              className="h-9 px-3 flex items-center gap-2"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <EditIcon
                className={cn('h-4 w-4', isEditMode ? '' : 'text-gray-400')}
              />
              <span className="text-sm">{t('edit')}</span>
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
    </div>
  );
};

export default MyPetClient;