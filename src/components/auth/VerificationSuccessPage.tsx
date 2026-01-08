'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

const VerificationSuccessPage = () => {
  const t = useTranslations('pages.VerificationSuccessPage');
  const router = useRouter();

  return (
    <div className="flex h-full grow flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-green-800">
              {t('title', { default: 'Email Verified!' })}
            </h1>
            <p className="text-gray-600">
              {t('subtitle', { 
                default: 'Congratulations! Your email address has been successfully verified. You now have full access to all Chapiz features.' 
              })}
            </p>
          </div>

          <div className="w-full space-y-3">
            <Button
              onClick={() => router.push('/pages/my-pets')}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {t('continueButton', { default: 'Continue to My Pets' })}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/pages/user/settings')}
              className="w-full"
            >
              {t('settingsButton', { default: 'Go to Settings' })}
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            {t('welcomeMessage', { 
              default: 'Welcome to Chapiz! Your pet\'s safety is our priority.' 
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationSuccessPage;
