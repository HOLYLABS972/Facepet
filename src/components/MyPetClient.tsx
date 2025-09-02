// components/pages/my-pets/MyPetsClient.tsx
'use client';

import MyPetCard from '@/components/MyPetCard';
import PetDetailsBottomSheet from '@/components/PetDetailsBottomSheet';
import { User, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { usePoints } from '@/src/contexts/PointsContext';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import InviteFriendsCard from './InviteFriendsCard';
import PhoneNumberBottomSheet from './PhoneNumberBottomSheet';
import AdminNotificationCard from './AdminNotificationCard';
import PointsBreakdownNotification from './PointsBreakdownNotification';
import PrizeClaimNotification from './PrizeClaimNotification';
import EarningNotification from './notifications/EarningNotification';
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
  const { userPoints, setUserPoints, pointsBreakdown, setPointsBreakdown, showPointsBreakdown, setShowPointsBreakdown, addPoints } = usePoints();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [pets, setPets] = useState(initialPets);
  const [petsLoading, setPetsLoading] = useState(false);

  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [showPhoneBottomSheet, setShowPhoneBottomSheet] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showPetBottomSheet, setShowPetBottomSheet] = useState(false);

  const [hasAddedPet, setHasAddedPet] = useState(false); // Track if user has added a pet
  const [showPrizeNotification, setShowPrizeNotification] = useState(false);
  
  // Individual earning notifications
  const [showRegistrationEarning, setShowRegistrationEarning] = useState(false);
  const [showPhoneEarning, setShowPhoneEarning] = useState(false);
  const [showPetEarning, setShowPetEarning] = useState(false);
  const [showShareEarning, setShowShareEarning] = useState(false);
  
  // Use ref to track previous pets count to avoid multiple point awards
  const previousPetsCountRef = useRef(0);
  
  // Show registration earning notification for new users
  useEffect(() => {
    if (user && !loading) {
      // Check if this is a new user (no pets and no phone number)
      // You can add more sophisticated logic here to detect new users
      const isNewUser = pets.length === 0 && !user.phoneNumber;
      if (isNewUser) {
        // Show registration earning notification after a short delay
        setTimeout(() => {
          setShowRegistrationEarning(true);
        }, 1000);
      }
    }
  }, [user, loading, pets.length]);

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
              console.log('Pet data from Firestore:', data);
              return {
                id: doc.id,
                name: data.name || 'Unknown Pet',
                breed: data.breedName || data.breed || 'Unknown Breed',
                image: data.imageUrl || '/default-pet.png'
              };
            });
            
            // Check if user just added a pet (pets count increased)
            const previousPetsCount = previousPetsCountRef.current;
            const currentPetsCount = petsData.length;
            
            if (currentPetsCount > previousPetsCount) {
              // User added a new pet, award 10 points
              setUserPoints(prev => prev + 10);
              setHasAddedPet(true);
              // Update points breakdown
              setPointsBreakdown(prev => ({ ...prev, pet: prev.pet + 10 }));
              // Show individual pet earning notification
              setShowPetEarning(true);
              console.log('User added a pet! Awarded 10 points. Total points:', userPoints + 10);
            }
            
            // Update the ref with the current count
            previousPetsCountRef.current = currentPetsCount;
            
            setPets(petsData);
          } else {
            console.log('No pets found for user');
            setPets([]);
            previousPetsCountRef.current = 0;
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



  // Check if user has phone number set - show bottom sheet if not
  useEffect(() => {
    const checkUserPhoneNumber = async () => {
      if (user && !loading) {
        try {
          // Get user data from Firestore to check phone number
          const { getUserFromFirestore } = await import('@/src/lib/firebase/users');
          const userResult = await getUserFromFirestore(user.uid);
          
          if (userResult.success && userResult.user) {
            const hasPhoneNumber = userResult.user.phone && userResult.user.phone.trim() !== '';
            if (!hasPhoneNumber) {
              // Show phone setup bottom sheet automatically
              setShowPhoneBottomSheet(true);
            }
          } else {
            // If we can't get user data, show phone setup as fallback
            setShowPhoneBottomSheet(true);
          }
        } catch (error) {
          console.error('Error checking user phone number:', error);
          // Show phone setup as fallback
          setShowPhoneBottomSheet(true);
        }
      }
    };

    checkUserPhoneNumber();
  }, [user, loading]);



  // Fetch admin notifications (placeholder for future implementation)
  useEffect(() => {
    const fetchAdminNotifications = async () => {
      if (user && !loading) {
        try {
          // TODO: Implement admin notifications fetching from Firestore
          // For now, we'll use empty array
          setAdminNotifications([]);
        } catch (error) {
          console.log('Error fetching admin notifications:', error);
          setAdminNotifications([]);
        }
      }
    };

    fetchAdminNotifications();
  }, [user, loading]);

  const filteredPets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(search.toLowerCase())
  );



  const handlePetTap = (petId: string) => {
    router.push(`/pet/${petId}`);
  };

  const handleDeletePet = (petId: string) => {
    setPets(prev => prev.filter(pet => pet.id !== petId));
    setShowPetBottomSheet(false);
    setSelectedPet(null);
  };



  const handlePhoneAdded = (phone: string) => {
    // Hide the phone bottom sheet since user has added their phone
    setShowPhoneBottomSheet(false);
    // Add 5 points for completing phone setup
    setUserPoints(prev => prev + 5);
    // Update points breakdown
    setPointsBreakdown(prev => ({ ...prev, phone: 5 }));
    // Show individual phone earning notification
    setShowPhoneEarning(true);
    // Here you could also update the user's profile with the phone number
    console.log('Phone number added:', phone, 'User earned 5 points!');
  };

  // Function to show prize notification (for external calls)
  const showPrizeNotificationFunc = () => {
    setShowPrizeNotification(true);
  };

  // Make the function available globally for debugging/development
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showPrizeNotification = showPrizeNotificationFunc;
    }
  }, []);

  // Debug: Log current points whenever they change
  useEffect(() => {
    console.log('Current user points:', userPoints);
  }, [userPoints]);



  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-6">
        <div className="text-center">
          <h1 className="text-primary py-2 font-['Lobster'] text-3xl tracking-wide lg:text-4xl">
            {t('welcomeBack')}
          </h1>
          


          <p className="text-base text-gray-600">
            {t('managePetsDescription')}
          </p>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">{t('notifications')}</h2>
        
        {/* Individual Earning Notifications */}
        <EarningNotification
          onClose={() => setShowRegistrationEarning(false)}
          points={30}
          action="registration"
          isVisible={showRegistrationEarning}
        />
        
        <EarningNotification
          onClose={() => setShowPhoneEarning(false)}
          points={5}
          action="phoneSetup"
          isVisible={showPhoneEarning}
        />
        
        <EarningNotification
          onClose={() => setShowPetEarning(false)}
          points={10}
          action="addPet"
          isVisible={showPetEarning}
        />
        
        <EarningNotification
          onClose={() => setShowShareEarning(false)}
          points={5}
          action="share"
          isVisible={showShareEarning}
        />
        
        {/* Share with Friends - always show */}
        <div className="mb-4">
          <InviteFriendsCard 
            onClose={() => {}} 
            onShareSuccess={() => {
              // Award 5 points for sharing
              addPoints('share', 5);
              // Show individual share earning notification
              setShowShareEarning(true);
              console.log('User shared the app! Awarded 5 points. Total points:', userPoints + 5);
            }}
          />
        </div>
        
        {/* Points Breakdown Notification */}
        {showPointsBreakdown && (
          <div className="mb-4">
            <PointsBreakdownNotification 
              onClose={() => setShowPointsBreakdown(false)}
              totalPoints={userPoints}
              registrationPoints={pointsBreakdown.registration}
              phonePoints={pointsBreakdown.phone}
              petPoints={pointsBreakdown.pet}
              sharePoints={pointsBreakdown.share}
              onClaimPrize={() => {
                // Hide the points breakdown notification after claiming
                setShowPointsBreakdown(false);
                console.log('Prize claimed!');
              }}
            />
          </div>
        )}

        {/* Prize Claim Notification */}
        {showPrizeNotification && (
          <div className="mb-4">
            <PrizeClaimNotification 
              onClaim={() => {
                setShowPrizeNotification(false);
                console.log('Prize claimed from notification!');
              }}
            />
          </div>
        )}


        
        {/* Admin Notifications */}
        {adminNotifications.map((notification, index) => {
          const handleClose = () => {
            setAdminNotifications(prev => {
              // Find the current index of this notification in the updated array
              const currentIndex = prev.findIndex(n => 
                n.title === notification.title && 
                n.message === notification.message &&
                n.type === notification.type
              );
              return prev.filter((_, i) => i !== currentIndex);
            });
          };
          
          return (
            <div key={`notification-${index}-${notification.title}`} className="mb-4">
              <AdminNotificationCard
                title={notification.title}
                message={notification.message}
                type={notification.type}
                actionText={notification.actionText}
                onAction={notification.onAction}
                onClose={handleClose}
              />
            </div>
          );
        })}
        

        

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
              onTap={handlePetTap}
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

      {/* Bottom Sheets */}
      <PhoneNumberBottomSheet
        isOpen={showPhoneBottomSheet}
        onClose={() => setShowPhoneBottomSheet(false)}
        onPhoneAdded={handlePhoneAdded}
      />

      <PetDetailsBottomSheet
        isOpen={showPetBottomSheet}
        onClose={() => {
          setShowPetBottomSheet(false);
          setSelectedPet(null);
        }}
        pet={selectedPet}
        onDeletePet={handleDeletePet}
      />
    </div>
  );
};

export default MyPetsClient;
