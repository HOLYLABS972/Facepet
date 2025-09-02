'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wifi, Copy, Check, Smartphone, Tag, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import toast from 'react-hot-toast';
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
    {
      id: 3,
      title: t('steps.record.title'),
      description: t('steps.record.description'),
      icon: Wifi,
    },
  ];
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(true);

  // Check for NFC support when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNfcSupported('NDEFReader' in window);
    }
  }, []);

  const petShareUrl = typeof window !== 'undefined' ? `${window.location.origin}/pet/${pet.id}` : '';

  const handleRecordTag = async () => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      toast.error(t('recordTag.errors.notSupported'));
      setNfcSupported(false);
      return;
    }

    if (!petShareUrl) {
      toast.error(t('recordTag.errors.unableToGenerateUrl'));
      return;
    }

    setIsRecording(true);

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: petShareUrl
          }
        ]
      });
      
      setIsRecorded(true);
      toast.success(t('recordTag.success'));
    } catch (error) {
      console.error('Error writing to NFC tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`${t('recordTag.errors.writeFailed')}: ${errorMessage}`);
    } finally {
      setIsRecording(false);
    }
  };

  const handleCopyLink = async () => {
    if (!petShareUrl) {
      toast.error(t('recordTag.errors.unableToGenerateUrl'));
      return;
    }

    try {
      await navigator.clipboard.writeText(petShareUrl);
      setCopied(true);
      toast.success(t('shareableLink.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t('shareableLink.error'));
    }
  };

  const handleShare = async () => {
    if (!petShareUrl) {
      toast.error(t('recordTag.errors.unableToGenerateUrl'));
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${pet.name} - Pet Profile`,
          text: `Check out ${pet.name}'s pet profile!`,
          url: petShareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
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
          <h3 className="text-lg font-semibold mb-4">How to attach NFC tag:</h3>
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

        {/* Record Tag Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="w-5 h-5" />
                <span>{t('recordTag.title')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {t('recordTag.description', { petName: pet.name })}
              </p>
              <Button
                onClick={handleRecordTag}
                disabled={isRecording || isRecorded}
                className="w-full"
                size="lg"
              >
                {isRecording ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('recordTag.button.recording')}
                  </>
                ) : isRecorded ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t('recordTag.button.recorded')}
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 mr-2" />
                    {t('recordTag.button.default')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Shareable Link Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="w-5 h-5" />
                <span>{t('shareableLink.title')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {t('shareableLink.description', { petName: pet.name })}
              </p>
              <div className="flex space-x-2">
                <div className="flex-1 p-3 bg-gray-100 rounded-lg text-sm font-mono break-all">
                  {petShareUrl}
                </div>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
