'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/src/lib/firebase/config';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const t = useTranslations('pages.ForgotPasswordPage');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(t('errors.emailRequired'));
      return;
    }

    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(t('messages.resetLinkSent'));
      router.push('/auth/reset-password-sent');
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error(t('errors.userNotFound'));
      } else if (error.code === 'auth/invalid-email') {
        toast.error(t('errors.invalidEmail'));
      } else {
        toast.error(t('errors.generalError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg">
          <CardHeader className="text-center relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="absolute left-0 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-0"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <CardTitle className="text-2xl font-bold text-gray-800 rtl:text-right">
              {t('title')}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2 rtl:text-right">
              {t('subtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 rtl:text-right">
                  {t('form.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 rtl:left-auto rtl:right-3" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('form.emailPlaceholder')}
                    required
                    className="pl-10 rtl:pl-3 rtl:pr-10 rtl:text-right"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? t('sending') : t('sendResetLink')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/auth')}
                className="text-sm rtl:text-right"
              >
                {t('backToSignIn')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
