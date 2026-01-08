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
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getBreedNameById } from '@/src/lib/supabase/database/pets';
import { supabase } from '@/src/lib/supabase/client';

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
      if (user?.email && !loading) {
        setPetsLoading(true);
        try {
          // Use Supabase to fetch pets
          const { getPetWithConsolidatedOwner } = await import('@/src/lib/supabase/database/pets');

          // Query pets by user email
          const { data: petsData, error } = await supabase
            .from('pets')
            .select('id')
            .eq('user_email', user.email);

          if (error) {
            console.error('Error fetching pets:', error);
            setPetsLoading(false);
            return;
          }

          const querySnapshot = { empty: !petsData || petsData.length === 0, size: petsData?.length || 0, docs: petsData || [] };
          console.log('Query snapshot size:', querySnapshot.size);
          console.log('User email:', user.email);

          if (!querySnapshot.empty && petsData) {
            // Use the same data fetching method as pet details page
            const fetchedPets = await Promise.all(petsData.map(async (petDoc: any) => {
              try {
                // Use the same function that works for the details page
                const result = await getPetWithConsolidatedOwner(petDoc.id);
                
                if (result.success && result.pet) {
                  console.log('Pet data from consolidated method:', result.pet);
                  // Get breed name with proper translation
                  let breedDisplay = result.pet.breedName || result.pet.breed || 'Unknown Breed';
                  if (result.pet.breedId) {
                    breedDisplay = await getBreedNameById(result.pet.breedId, locale);
                  } else if (breedDisplay && breedDisplay !== 'Unknown Breed') {
                    // Check if breedDisplay is actually an ID (e.g., "dog-3", "cat-5")
                    if (breedDisplay.startsWith('dog-') || breedDisplay.startsWith('cat-')) {
                      // It's a legacy breed ID format, try to parse it
                      const idMatch = breedDisplay.match(/\d+/);
                      if (idMatch) {
                        breedDisplay = await getBreedNameById(parseInt(idMatch[0]), locale);
                      }
                    } else {
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
                  }
                  
                  return {
                    id: result.pet.id,
                    name: result.pet.name || 'Unknown Pet',
                    breed: breedDisplay,
                    image: result.pet.imageUrl || '/default-pet.png'
                  };
                } else {
                  // Fallback to basic data if consolidated method fails
                  // Get the pet data directly from the petDoc
                  return {
                    id: petDoc.id,
                    name: 'Unknown Pet',
                    breed: 'Unknown Breed',
                    image: '/default-pet.png'
                  };
                  /* Legacy fallback - not needed with Supabase
                  const data = petDoc;
                  let breedDisplay = data.breedName || data.breed || 'Unknown Breed';
                  if (data.breedId) {
                    breedDisplay = await getBreedNameById(data.breedId, locale);
                  } else if (breedDisplay && breedDisplay !== 'Unknown Breed') {
                    if (breedDisplay.startsWith('dog-') || breedDisplay.startsWith('cat-')) {
                      const idMatch = breedDisplay.match(/\d+/);
                      if (idMatch) {
                        breedDisplay = await getBreedNameById(parseInt(idMatch[0]), locale);
                      }
                    }
                  }
                  */
                }
              } catch (error) {
                console.error('Error fetching pet with consolidated method:', error);
                return {
                  id: petDoc.id,
                  name: 'Unknown Pet',
                  breed: 'Unknown Breed',
                  image: '/default-pet.png'
                };
              }
            }));

            console.log('Final processed pets data:', fetchedPets);
            setPets(fetchedPets);
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
    <div className="mx-auto max-w-7xl w-full px-4 md:px-6">
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
        <div className="flex justify-center pb-24 md:pb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
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
        </div>
      )}
    </div>
  );
};

export default MyPetClient;