// components/pages/my-pets/MyPetsClient.tsx
'use client';

import MyPetCard from '@/components/MyPetCard';
import { User, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import InviteFriendsCard from './InviteFriendsCard';
import PhoneNumberCard from './PhoneNumberCard';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useRouter } from '@/i18n/routing';
import { db } from '@/src/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

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
  const router = useRouter();
  const [search, setSearch] = useState('');
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
                breed: data.breedName || 'Unknown Breed',
                image: data.imageUrl || '/default-pet.png'
              };
            });
            setPets(petsData);
          } else {
            console.log('No pets found for user');
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

      {/* Share with Friends - moved above title */}
      <div className="mb-4">
        <InviteFriendsCard />
      </div>

      {/* Notifications Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">{t('notifications')}</h2>
        
        {/* Phone Number Notification - matching share style */}
        <div className="mb-4">
          <PhoneNumberCard />
        </div>
      </div>

      {/* My Pets Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
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
            />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <Button
        onClick={() => router.push('/add-pet')}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
        size="icon"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
};

export default MyPetsClient;
