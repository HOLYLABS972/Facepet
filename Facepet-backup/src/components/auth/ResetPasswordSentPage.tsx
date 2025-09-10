'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from '@/i18n/routing';
import { CheckCircle, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

const ResetPasswordSentPage = () => {
  const t = useTranslations('pages.ResetPasswordSentPage');
  const router = useRouter();

  return (
    <div className="flex h-full grow flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {t('title', { default: 'Check your email' })}
            </h1>
            <p className="text-gray-600">
              {t('subtitle', { 
                default: 'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.' 
              })}
            </p>
          </div>

          <div className="flex items-center space-x-2 rounded-lg bg-blue-50 p-4">
            <Mail className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              {t('checkSpam', { 
                default: 'Don\'t see the email? Check your spam folder.' 
              })}
            </p>
          </div>

          <div className="space-y-3 w-full">
            <Button
              onClick={() => router.push('/auth/sign-in')}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {t('backToSignIn', { default: 'Back to Sign In' })}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/auth/forgot')}
              className="w-full"
            >
              {t('resendEmail', { default: 'Resend Email' })}
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            {t('expiry', { 
              default: 'The reset link will expire in 1 hour for security reasons.' 
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordSentPage;
