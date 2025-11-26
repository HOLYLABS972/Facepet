'use client';

import AnimatedTabs, { TabName } from '@/components/AnimatedTabs';
import PetCard from '@/components/PetCard';
import TabContent from '@/components/TabContent';
import { Promo } from '@/types/promo';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import GiftPopup from './GiftPopup';
import Navbar from './layout/Navbar';
import ShareButton from './ShareButton';
import { getBreedNameFromId, convertBreedSlugToName } from '@/src/lib/firebase/breed-utils';
import { getGenders } from '@/src/lib/hardcoded-data';
import { breedsData } from '@/src/lib/data/comprehensive-breeds';
import AdFullPage from './get-started/AdFullPage';
import { fetchRandomPromo } from '@/lib/actions/promo-server';
import { usePetId } from '@/hooks/use-pet-id';

const computeAge = (birthDate: string) => {
  const birth = new Date(birthDate);
  const now = new Date();
  const diff = now.getTime() - birth.getTime();
  const ageYears = Math.floor(diff / (1000 * 3600 * 24 * 365));
  return String(ageYears);
};

export default function PetProfilePage({
  pet,
  owner,
  vet
}: {
  pet: any;
  owner?: any;
  vet?: any;
}) {
  // Place all hook calls at the top level, unconditionally
  const t = useTranslations('pages.PetProfilePage');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>('pet');
  const prevTabRef = useRef<TabName>('pet');
  const { petId: localStoragePetId, savePetId } = usePetId();
  const [showPromo, setShowPromo] = useState(false);
  const [promo, setPromo] = useState<Promo | null>(null);
  const [isLoadingPromo, setIsLoadingPromo] = useState(false);
  const adShownRef = useRef<boolean>(false); // Track if ad has been shown on this page load
  
  // Get data from URL parameters if available (passed from My Pets page)
  const displayName = searchParams.get('displayName');
  const displayBreed = searchParams.get('displayBreed');
  const displayImage = searchParams.get('displayImage');
  
  // Save petId to localStorage when pet profile page loads (for ad tracking)
  useEffect(() => {
    if (pet?.id && pet.id !== localStoragePetId) {
      savePetId(pet.id);
      console.log('[PetProfilePage] Saved petId to localStorage:', pet.id);
    }
  }, [pet?.id, localStoragePetId, savePetId]);
  
  // Load and show ad when pet profile page loads (mandatory ad - only once)
  useEffect(() => {
    const loadPromo = async () => {
      // Only show ad if pet exists and we haven't shown an ad yet on this page load
      const hasPet = localStoragePetId || pet?.id;
      
      if (hasPet && !adShownRef.current && !showPromo && !isLoadingPromo && !promo) {
        setIsLoadingPromo(true);
        try {
          console.log('[PetProfilePage] Loading mandatory ad for pet profile page');
          const randomPromo = await fetchRandomPromo();
          if (randomPromo && (randomPromo.imageUrl || randomPromo.youtubeUrl)) {
            setPromo(randomPromo);
            setShowPromo(true);
            adShownRef.current = true; // Mark that ad has been shown
            console.log('[PetProfilePage] Ad loaded and will be displayed');
          } else {
            console.log('[PetProfilePage] No promo available');
            adShownRef.current = true; // Mark as shown even if no promo (prevent retry)
          }
        } catch (error) {
          console.error('[PetProfilePage] Error loading promo:', error);
          adShownRef.current = true; // Mark as shown even on error (prevent retry)
        } finally {
          setIsLoadingPromo(false);
        }
      }
    };

    loadPromo();
  }, [localStoragePetId, pet?.id]); // Removed showPromo, isLoadingPromo, promo from dependencies

  const handlePromoClose = () => {
    setShowPromo(false);
    setPromo(null);
    // Don't reset adShownRef - we want to show ad only once per page load
  };
  

  // Determine available tabs (exclude Vet if no vet data)
  const availableTabs: TabName[] = ['pet', 'owner'];
  if (
    vet?.name ||
    vet?.phoneNumber ||
    vet?.email ||
    vet?.address
  ) {
    availableTabs.push('vet');
  }

  // Memoized values
  const petCardData = useMemo(
    () => ({ 
      name: displayName || pet.name, 
      imageUrl: displayImage || pet.imageUrl 
    }),
    [displayName, pet.name, displayImage, pet.imageUrl]
  );

  const lockedDirection = useMemo(() => {
    const prevIndex = availableTabs.indexOf(prevTabRef.current);
    const newIndex = availableTabs.indexOf(activeTab);
    return newIndex > prevIndex ? 1 : -1;
  }, [activeTab, availableTabs]);

  // Helper function to translate gender
  const getGenderLabel = (genderValue: string | undefined): string => {
    if (!genderValue) return t('labels.notSpecified');
    const genders = getGenders(locale as 'en' | 'he');
    const normalizedValue = genderValue.toLowerCase().trim();
    // Try to find by value first (male/female)
    let gender = genders.find(g => g.value.toLowerCase() === normalizedValue);
    // If not found, try to find by label (Male/Female)
    if (!gender) {
      gender = genders.find(g => g.label.toLowerCase() === normalizedValue);
    }
    // If still not found, check English labels for Hebrew locale
    if (!gender && locale === 'he') {
      const englishGenders = getGenders('en');
      const englishGender = englishGenders.find(g => 
        g.value.toLowerCase() === normalizedValue || 
        g.label.toLowerCase() === normalizedValue
      );
      if (englishGender) {
        const hebrewGenders = getGenders('he');
        gender = hebrewGenders.find(g => g.value === englishGender.value);
      }
    }
    return gender ? gender.label : genderValue;
  };

  // Helper function to get breed display name (EXACT same logic as MyPetsClient lines 69-83)
  const getBreedDisplayName = (): string => {
    // If breed was passed from My Pets via URL, use it directly (already translated)
    if (displayBreed) {
      console.log('PetProfilePage - using breed from URL:', displayBreed);
      return displayBreed;
    }
    
    console.log('PetProfilePage - pet data:', { 
      breedId: pet.breedId, 
      breedName: pet.breedName, 
      breed: pet.breed,
      locale 
    });
    
    // Get breed name with proper translation (exact same logic as MyPetClient)
    let breedDisplay = pet.breedName || pet.breed || 'Unknown Breed';
    console.log('PetProfilePage - initial breedDisplay:', breedDisplay);
    
    if (pet.breedId) {
      breedDisplay = getBreedNameFromId(String(pet.breedId), locale as 'en' | 'he');
      console.log('PetProfilePage - breed from ID:', breedDisplay);
    } else if (breedDisplay && breedDisplay !== 'Unknown Breed') {
      // Try to find the breed in comprehensive data and translate it
      const breed = breedsData.find(b => 
        b.en.toLowerCase() === breedDisplay.toLowerCase() || 
        b.he === breedDisplay
      );
      console.log('PetProfilePage - breed found in data:', breed);
      if (breed) {
        breedDisplay = locale === 'he' ? breed.he : breed.en;
      }
    }
    
    console.log('PetProfilePage - final breedDisplay:', breedDisplay);
    return breedDisplay;
  };

  // Build data arrays with privacy checks
  // Pet name, breed, gender, and age are always public
  const petInfo = [
    {
      label: t('labels.name'),
      value: displayName || pet.name
    },
    {
      label: t('labels.breed'),
      value: getBreedDisplayName()
    },
    {
      label: t('labels.gender'),
      value: getGenderLabel(pet.gender)
    },
    {
      label: t('labels.age'),
      value: pet.birthDate
        ? computeAge(pet.birthDate) + ' ' + t('labels.ageText')
        : pet.age || ''
    },
    {
      label: t('labels.notes'),
      value: pet.notes || ''
    }
  ];

  const ownerInfo = owner
    ? [
        {
          // Owner name is always public
          label: t('labels.name'),
          value: owner.fullName || owner.displayName || ''
        },
        {
          label: t('labels.contact'),
          value: owner.isPhonePrivate
            ? t('labels.private')
            : owner.phoneNumber || owner.phone || '',
          link: owner.isPhonePrivate
            ? undefined
            : owner.phoneNumber || owner.phone
            ? `https://wa.me/${(owner.phoneNumber || owner.phone || '').replace(/[^0-9]/g, '')}`
            : undefined
        },
        {
          label: t('labels.email'),
          value: owner.isEmailPrivate
            ? t('labels.private')
            : owner.email || '',
          link: owner.isEmailPrivate
            ? undefined
            : owner.email
            ? `mailto:${owner.email}`
            : undefined
        },
        {
          label: t('labels.address'),
          value: owner.isAddressPrivate
            ? t('labels.private')
            : owner.homeAddress || ''
        }
      ]
    : [];

  const vetInfo = vet
    ? [
        {
          label: t('labels.name'),
          value: vet.isNamePrivate ? t('labels.private') : vet.name
        },
        {
          label: t('labels.contact'),
          value: vet.isPhonePrivate
            ? t('labels.private')
            : vet.phoneNumber
        },
        {
          label: t('labels.email'),
          value: vet.isEmailPrivate ? t('labels.private') : vet.email
        },
        {
          label: t('labels.address'),
          value: vet.isAddressPrivate
            ? t('labels.private')
            : vet.address
        }
      ]
    : [];

  // Effect hooks
  useEffect(() => {
    prevTabRef.current = activeTab;
  }, [activeTab]);

  // Gift popup disabled temporarily
  // useEffect(() => {
  //   const hasSeenGift = localStorage.getItem(`giftShown_${pet.id}`);

  //   if (!hasSeenGift) {
  //     const timer = setTimeout(() => {
  //       setShowPopup(true);
  //       localStorage.setItem(`giftShown_${pet.id}`, 'true');
  //     }, 1000 * 5); // 5 seconds delay

  //     return () => clearTimeout(timer);
  //   }
  // }, [pet.id]);

  // Event handlers
  const handleTabChange = (tab: TabName) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

  // Show ad if promo is loaded (mandatory ad on pet profile page)
  if (showPromo && promo && (promo.imageUrl || promo.youtubeUrl)) {
    return (
      <AdFullPage
        type={promo.youtubeUrl ? 'youtube' : 'image'}
        time={5}
        content={promo.imageUrl || ''}
        youtubeUrl={promo.youtubeUrl}
        onClose={handlePromoClose}
      />
    );
  }

  // Main component render
  return (
    <>
      <Navbar />
      
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="relative overflow-hidden">
          {/* Back Button */}
          <div className="absolute top-[36px] left-[36px] right-[36px] z-10 flex justify-start rtl:justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="bg-white/90 hover:bg-white shadow-md"
            >
              {locale === 'he' ? (
                <ArrowLeft className="h-5 w-5" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </Button>
          </div>
          <PetCard pet={petCardData} />
        </div>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          transition={{
            type: 'spring',
            bounce: 0.3,
            duration: 0.7
          }}
          className="flex flex-grow flex-col"
        >
          <div className="mt-6 mb-2 flex justify-center">
            <AnimatedTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              showVetTab={availableTabs.includes('vet')}
            />
          </div>
          <div className="to-background flex h-full w-full grow rounded-t-3xl bg-linear-to-b from-white">
            <TabContent
              activeTab={activeTab}
              lockedDirection={lockedDirection}
              petInfo={petInfo}
              ownerInfo={ownerInfo}
              vetInfo={vetInfo}
            />
          </div>
        </motion.div>
        <ShareButton />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl w-full px-6 py-8">
          {/* Back Button */}
          <div className="mb-6 flex justify-start rtl:justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              {locale === 'he' ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Main Content: Image Left, Cards Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Pet Image */}
            <div className="flex flex-col">
              <div className="sticky top-24">
                <div className="relative w-full" style={{ height: '600px' }}>
                  <div className="absolute inset-0 [&>div]:!mt-0 [&>div]:!px-0 [&>div>div]:!h-full [&>div>div>div]:!h-full">
                    <PetCard pet={petCardData} />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <ShareButton />
              </div>
            </div>

            {/* Right Side - Tabs and Content */}
            <div className="flex flex-col">
              <div className="bg-white rounded-2xl shadow-lg flex flex-col" style={{ height: '600px' }}>
                <div className="p-6 pb-0 flex-shrink-0">
                  <AnimatedTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    showVetTab={availableTabs.includes('vet')}
                  />
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 p-6 pt-6">
                  <TabContent
                    activeTab={activeTab}
                    lockedDirection={lockedDirection}
                    petInfo={petInfo}
                    ownerInfo={ownerInfo}
                    vetInfo={vetInfo}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gift popup disabled temporarily */}
      {/* {showPopup && (
        <GiftPopup
          onClose={() => setShowPopup(false)}
          title={t('popup.title')}
          text={t('popup.text')}
          buttonText={t('popup.buttonLabel')}
        />
      )} */}
    </>
  );
}
