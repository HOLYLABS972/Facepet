'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { usePetId } from '@/src/hooks/use-pet-id';
import Image from 'next/image';

interface TagFoundPageProps {
  petId: string;
}

export default function TagFoundPage({ petId }: TagFoundPageProps) {
  const t = useTranslations('pages.TagFound');
  const { user, loading: authLoading } = useAuth();
  const { savePetId } = usePetId();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRegisterPet = async () => {
    setIsProcessing(true);
    
    if (user) {
      // User is logged in, go directly to registration
      router.push(`/pet/${petId}/get-started/register`);
    } else {
      // User is not logged in, save the pet ID and redirect to auth
      savePetId(petId);
      router.push('/auth');
    }
  };

  const handleSignIn = () => {
    // Save the pet ID before redirecting to auth
    savePetId(petId);
    router.push('/auth');
  };

  if (authLoading) {
    return (
      <div className="flex grow flex-col items-center">
        <Image src="/assets/Facepet-logo.png" alt="FacePet Logo" width={150} height={150} className="mb-4" />
        <div className="justify-center p-10 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex grow flex-col items-center">
      <Image src="/assets/Facepet-logo.png" alt="FacePet Logo" width={150} height={150} className="mb-4" />
      <div className="justify-center p-10 text-center">
        <h1 className="text-primary text-3xl font-bold">{t('title')}</h1>
        <p className="text-base text-gray-500">{t('subtitle')}</p>
        
        {user ? (
          <div className="mt-6 space-y-3">
            <p className="text-green-700 font-medium">{t('welcomeBack', { name: user.displayName || user.email })}</p>
            <Button
              onClick={handleRegisterPet}
              disabled={isProcessing}
              className="bg-primary mt-4 rounded-full font-normal hover:bg-[#ff6243]/90"
            >
              {isProcessing ? t('processing') : t('registerPet')}
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-orange-700 font-medium">{t('needAccount')}</p>
            <Button
              onClick={handleRegisterPet}
              disabled={isProcessing}
              className="bg-primary mt-4 rounded-full font-normal hover:bg-[#ff6243]/90"
            >
              {isProcessing ? t('processing') : t('createAccountAndRegister')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
