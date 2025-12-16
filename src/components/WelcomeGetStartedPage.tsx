'use client';

import { Button } from '@/components/ui/button';
import { useRandomAd } from '@/hooks/useRandomAd';
import { usePathname, useRouter } from '@/i18n/routing';
import { usePetId } from '@/src/hooks/use-pet-id';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Suspense, useEffect } from 'react';
import AdHeader from './get-started/AdHeader';
import Footer from './layout/Footer';

// Dynamically import heavy components
const AdFullPage = dynamic(() => import('./get-started/AdFullPage'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-50 bg-black" />
});

const AnimatedPetCharacters = dynamic(() => import('./AnimatedPetCharacters'), {
  ssr: false,
  loading: () => <div className="relative min-h-[350px] w-full" />
});

export default function WelcomeGetStartedPage() {
  const t = useTranslations('pages.WelcomePage');
  const router = useRouter();
  const pathName = usePathname();
  const petId = pathName.split('/')[2];
  const { savePetId } = usePetId();
  const { user, signOut } = useAuth();
  const { showAd, adData, handleAdClose } = useRandomAd(null, 1);

  useEffect(() => {
    if (petId) savePetId(petId as string);
  }, [petId, savePetId]);

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

  return (
    <div className="flex h-full grow flex-col">
      <AdHeader />
      {/* Main Content */}
      <div className="mt-36 px-7">
        <div className="flex justify-center mb-4">
          <Image
            src="/assets/Facepet.png"
            alt="FacePet"
            width={250}
            height={100}
            className="h-16 w-auto object-contain"
            priority
          />
        </div>

        <div className="text-center text-2xl">
          <p className="text-gray-500">{t('upperTitle')}</p>
          <p className="text-black">{t('lowerTitle')}</p>
        </div>

        <Button
          onClick={() =>
            user
              ? router.push(`/pet/${petId}/get-started/register`)
              : router.push(`/auth`)
          }
          className="bg-primary hover:bg-primary mt-12 h-[60px] w-full rounded-full text-sm font-normal shadow-xl hover:opacity-70"
        >
          {t('buttonLabel')}
        </Button>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-500">
            {user ? t('signOutText') : t('signInText')}
          </span>
          <Button
            onClick={async () => {
              if (user) {
                await signOut();
                router.push('/');
              } else {
                router.push(`/auth`);
              }
            }}
            className="text-primary p-0 font-bold underline hover:bg-transparent"
            variant={'ghost'}
          >
            {user ? t('signOutLink') : t('signInLink')}
          </Button>
        </div>
      </div>

      {/* Pet Characters */}
      <Suspense fallback={<div className="relative min-h-[350px] w-full" />}>
        <AnimatedPetCharacters />
      </Suspense>
      <Footer />
    </div>
  );
}
