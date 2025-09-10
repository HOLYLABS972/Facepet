'use client';

import AnimatedTabs, { TabName } from '@/components/AnimatedTabs';
import PetCard from '@/components/PetCard';
import TabContent from '@/components/TabContent';
import { Ad, useRandomAd } from '@/hooks/useRandomAd';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import AdFullPage from './get-started/AdFullPage';
import GiftPopup from './GiftPopup';
import Navbar from './layout/Navbar';
import ShareButton from './ShareButton';

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
  vet,
  initialAd
}: {
  pet: any;
  owner?: any;
  vet?: any;
  initialAd?: Ad | null;
}) {
  // Place all hook calls at the top level, unconditionally
  const t = useTranslations('pages.PetProfilePage');
  const locale = useLocale();
  const [showPopup, setShowPopup] = useState(false);
  const { showAd, adData, handleAdClose } = useRandomAd(initialAd);
  const [activeTab, setActiveTab] = useState<TabName>('pet');
  const prevTabRef = useRef<TabName>('pet');

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
    () => ({ name: pet.name, imageUrl: pet.imageUrl }),
    [pet.name, pet.imageUrl]
  );

  const lockedDirection = useMemo(() => {
    const prevIndex = availableTabs.indexOf(prevTabRef.current);
    const newIndex = availableTabs.indexOf(activeTab);
    return newIndex > prevIndex ? 1 : -1;
  }, [activeTab, availableTabs]);

  // Build data arrays with privacy checks
  // Pet name, breed, gender, and age are always public
  const petInfo = [
    {
      label: t('labels.name'),
      value: pet.name
    },
    {
      label: t('labels.breed'),
      value: pet.breed || pet.breedName || t('labels.notSpecified')
    },
    {
      label: t('labels.gender'),
      value: pet.gender || t('labels.notSpecified')
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

  useEffect(() => {
    const hasSeenGift = localStorage.getItem(`giftShown_${pet.id}`);

    if (!hasSeenGift) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        localStorage.setItem(`giftShown_${pet.id}`, 'true');
      }, 1000 * 5); // 5 seconds delay

      return () => clearTimeout(timer);
    }
  }, [pet.id]);

  // Event handlers
  const handleTabChange = (tab: TabName) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

  // Conditional rendering after all hooks
  if (showAd && adData?.content) {
    return (
      <AdFullPage
        type={adData.type}
        time={adData.duration}
        content={adData.content}
        onClose={handleAdClose}
      />
    );
  }

  // Main component render
  return (
    <>
      <Navbar />
      <div className="relative overflow-hidden">
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
      {showPopup && (
        <GiftPopup
          onClose={() => setShowPopup(false)}
          title={t('popup.title')}
          text={t('popup.text')}
          buttonText={t('popup.buttonLabel')}
        />
      )}
    </>
  );
}
