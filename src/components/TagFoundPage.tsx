'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, User, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { usePetId } from '@/src/hooks/use-pet-id';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center"
            >
              <Tag className="h-10 w-10 text-green-600" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {t('title')}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {t('description', { petId })}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-2 text-blue-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{t('tagDetected')}</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                {t('tagInfo')}
              </p>
            </div>

            {user ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 text-green-700 bg-green-50 rounded-lg p-3">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{t('welcomeBack', { name: user.displayName || user.email })}</span>
                </div>
                
                <Button
                  onClick={handleRegisterPet}
                  disabled={isProcessing}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t('processing')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>{t('registerPet')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 text-orange-700 bg-orange-50 rounded-lg p-3">
                  <UserPlus className="h-5 w-5" />
                  <span className="font-medium">{t('needAccount')}</span>
                </div>
                
                <Button
                  onClick={handleRegisterPet}
                  disabled={isProcessing}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t('processing')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>{t('createAccountAndRegister')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
                
                <Button
                  onClick={handleSignIn}
                  variant="outline"
                  className="w-full h-10"
                >
                  {t('alreadyHaveAccount')}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
