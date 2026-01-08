'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ResetPasswordSentPage() {
  const t = useTranslations('pages.ResetPasswordSentPage');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg">
          <CardHeader className="text-center relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="absolute left-0 top-1/2 -translate-y-1/2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {t('title')}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {t('subtitle')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Mail className="h-12 w-12 text-gray-400" />
              </div>

            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth')}
                className="w-full"
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
