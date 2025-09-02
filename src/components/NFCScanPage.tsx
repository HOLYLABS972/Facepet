'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wifi, Copy, Check, Smartphone, Tag, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import toast from 'react-hot-toast';

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

const STEPS = [
  {
    id: 1,
    title: 'Prepare Your NFC Tag',
    description: 'Make sure your NFC tag is ready and within reach',
    icon: Tag,
  },
  {
    id: 2,
    title: 'Enable NFC on Your Phone',
    description: 'Turn on NFC in your phone settings',
    icon: Smartphone,
  },
  {
    id: 3,
    title: 'Tap to Record',
    description: 'Tap your phone to the NFC tag to record the pet information',
    icon: Wifi,
  },
];

export default function NFCScanPage({ pet }: NFCScanPageProps) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(true);

  // Check for NFC support when component mounts
  useEffect(() => {
    setNfcSupported('NDEFReader' in window);
  }, []);

  const petShareUrl = `${window.location.origin}/pet/${pet.id}`;

  const handleRecordTag = async () => {
    if (!('NDEFReader' in window)) {
      toast.error('NFC is not supported on this device');
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
      toast.success('NFC tag recorded successfully!');
    } catch (error) {
      console.error('Error writing to NFC tag:', error);
      toast.error('Failed to write to NFC tag. Please try again.');
    } finally {
      setIsRecording(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(petShareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
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
              <h1 className="text-xl font-bold">Attach NFC Tag</h1>
              <p className="text-sm text-gray-600">Create a shareable pet profile</p>
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
                <span>Record NFC Tag</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!nfcSupported ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800">
                    NFC is not supported on this device. Please use a device with NFC capabilities.
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 mb-4">
                  Tap the button below and then tap your phone to the NFC tag to record {pet.name}'s information.
                </p>
              )}
              <Button
                onClick={handleRecordTag}
                disabled={isRecording || isRecorded || !nfcSupported}
                className="w-full"
                size="lg"
              >
                {isRecording ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recording...
                  </>
                ) : isRecorded ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Tag Recorded!
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 mr-2" />
                    Record Tag
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
                <span>Shareable Link</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Anyone with this link can view {pet.name}'s profile:
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
