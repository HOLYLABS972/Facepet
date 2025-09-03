'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Smartphone, Tag, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface Pet {
  id: string;
  name: string;
  type: string;
  breedName: string;
  imageUrl: string;
  description?: string;
  age?: string;
  gender?: string;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NFCScanPageProps {
  pet: Pet;
}

export default function NFCScanPage({ pet }: NFCScanPageProps) {
  const t = useTranslations('Pet.nfcTag');

  const STEPS = [
    {
      id: 1,
      title: t('steps.prepareTag.title'),
      description: t('steps.prepareTag.description'),
      icon: Tag,
    },
    {
      id: 2,
      title: t('steps.enableNfc.title'),
      description: t('steps.enableNfc.description'),
      icon: Smartphone,
    },
  ];
  const router = useRouter();

  const handleDownloadApp = () => {
    // You can customize this URL to point to your app store links
    const appStoreUrl = 'https://apps.apple.com/app/facepet'; // iOS
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.facepet'; // Android
    
    // Detect platform and redirect accordingly
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      window.open(appStoreUrl, '_blank');
    } else if (/android/i.test(userAgent)) {
      window.open(playStoreUrl, '_blank');
    } else {
      // Default to a general download page or show both options
      window.open(appStoreUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{t('title')}</h1>
              <p className="text-sm text-gray-600">{t('subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Pet Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  {pet.imageUrl ? (
                    <Image
                      src={pet.imageUrl}
                      alt={pet.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl">🐾</span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{pet.name}</h2>
                  <p className="text-gray-600">{pet.breedName}</p>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold mb-4">{t('howToAttach')}</h3>
          <div className="space-y-4">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="flex items-start space-x-4 p-4 bg-white rounded-lg border"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Download App Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>{t('downloadApp.title')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {t('downloadApp.description', { petName: pet.name })}
              </p>
              <Button
                onClick={handleDownloadApp}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('downloadApp.button')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
