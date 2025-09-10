'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Smartphone, Tag, Download, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { getMobileAppLinks } from '@/src/lib/actions/admin';

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
  const [mobileAppLinks, setMobileAppLinks] = useState({
    androidAppUrl: '',
    iosAppUrl: ''
  });
  const [userPlatform, setUserPlatform] = useState<'android' | 'ios' | 'web' | null>(null);

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

  // Platform detection function
  const detectPlatform = () => {
    if (typeof window === 'undefined') return 'web';
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (/android/.test(userAgent)) {
      return 'android';
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else {
      return 'web';
    }
  };

  // Load mobile app links
  useEffect(() => {
    const loadMobileAppLinks = async () => {
      try {
        const links = await getMobileAppLinks();
        setMobileAppLinks(links);
      } catch (error) {
        console.error('Error loading mobile app links:', error);
      }
    };
    
    loadMobileAppLinks();
  }, []);

  // Detect user platform
  useEffect(() => {
    setUserPlatform(detectPlatform());
  }, []);

  const handleDownloadApp = () => {
    if (userPlatform === 'android' && mobileAppLinks.androidAppUrl) {
      window.open(mobileAppLinks.androidAppUrl, '_blank');
    } else if (userPlatform === 'ios' && mobileAppLinks.iosAppUrl) {
      window.open(mobileAppLinks.iosAppUrl, '_blank');
    } else if (mobileAppLinks.androidAppUrl) {
      // Default to Android if available
      window.open(mobileAppLinks.androidAppUrl, '_blank');
    } else if (mobileAppLinks.iosAppUrl) {
      // Fallback to iOS if Android not available
      window.open(mobileAppLinks.iosAppUrl, '_blank');
    } else {
      console.warn('No mobile app links configured');
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
                    <img
                      src={pet.imageUrl}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load pet image:', pet.imageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
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
              
              {!mobileAppLinks.androidAppUrl && !mobileAppLinks.iosAppUrl ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">Mobile app download links are not configured yet.</p>
                  <p className="text-sm text-gray-400">Please contact the administrator.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Show platform-specific download or both options */}
                  {userPlatform === 'android' && mobileAppLinks.androidAppUrl ? (
                    <Button
                      onClick={() => window.open(mobileAppLinks.androidAppUrl, '_blank')}
                      className="w-full"
                      size="lg"
                    >
                      <div className="w-5 h-5 mr-2">🤖</div>
                      Download for Android
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  ) : userPlatform === 'ios' && mobileAppLinks.iosAppUrl ? (
                    <Button
                      onClick={() => window.open(mobileAppLinks.iosAppUrl, '_blank')}
                      className="w-full"
                      size="lg"
                    >
                      <div className="w-5 h-5 mr-2">🍎</div>
                      Download for iOS
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {/* Show both options for web users */}
                      {mobileAppLinks.androidAppUrl && (
                        <Button
                          onClick={() => window.open(mobileAppLinks.androidAppUrl, '_blank')}
                          className="w-full"
                          size="lg"
                        >
                          <div className="w-5 h-5 mr-2">🤖</div>
                          Download for Android
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      )}

                      {mobileAppLinks.iosAppUrl && (
                        <Button
                          onClick={() => window.open(mobileAppLinks.iosAppUrl, '_blank')}
                          className="w-full"
                          size="lg"
                        >
                          <div className="w-5 h-5 mr-2">🍎</div>
                          Download for iOS
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
