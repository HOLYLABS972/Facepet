'use client';

import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/src/contexts/AuthContext';

export default function AddPetPage() {
  const router = useRouter();
  const t = useTranslations('pages.AddPetPage');
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const handleAddPet = async () => {
    setLoading(true);
    try {
      // Generate a new pet ID
      const petId = uuidv4();
      
      // Navigate to the pet registration flow
      router.push(`/pet/${petId}/get-started`);
    } catch (error) {
      console.error('Error creating pet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t('cardTitle')}</CardTitle>
            <p className="text-gray-600 mt-2">
              {t('cardDescription')}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Features List */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('feature1Title')}</h3>
                  <p className="text-sm text-gray-600">{t('feature1Description')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('feature2Title')}</h3>
                  <p className="text-sm text-gray-600">{t('feature2Description')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('feature3Title')}</h3>
                  <p className="text-sm text-gray-600">{t('feature3Description')}</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <Button
                onClick={handleAddPet}
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('creating')}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>{t('addPetButton')}</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
