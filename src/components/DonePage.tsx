'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from '@/i18n/routing';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import Navbar from './layout/Navbar';
import PetCard from './PetCard';

// Assets - using public paths
const assets = {
  nfc: '/assets/nfc.png'
};
// Pet images - using public paths for Next.js Image component
const petImages = {
  bear: '/pets/bear.png',
  bunny: '/pets/bunny.png',
  dino: '/pets/dino.png',
  duck: '/pets/duck.png',
  penguin: '/pets/penguin.png',
  pig: '/pets/pig.png'
};

const petCharacters = [
  {
    id: 1,
    src: petImages.bear,
    alt: 'bear',
    size: 143,
    top: 100,
    right: 0
  },
  {
    id: 2,
    src: petImages.bunny,
    alt: 'bunny',
    size: 163,
    top: 1,
    right: -61
  },
  {
    id: 3,
    src: petImages.dino,
    alt: 'dino',
    size: 198,
    top: 10,
    right: 250
  },
  {
    id: 4,
    src: petImages.duck,
    alt: 'duck',
    size: 185,
    top: 150,
    right: -60
  },
  {
    id: 5,
    src: petImages.penguin,
    alt: 'penguin',
    size: 152,
    top: 180,
    right: 234
  },
  {
    id: 6,
    src: petImages.pig,
    alt: 'pig',
    size: 167,
    top: 120,
    right: 140
  }
];

interface DonePageProps {
  name: string;
  imageUrl: string;
}

export default function DonePage({ name, imageUrl }: DonePageProps) {
  const t = useTranslations('pages.DonePage');
  const router = useRouter();
  
  // Debug: Log the values to see what we're getting
  console.log('DonePage props:', { name, imageUrl });

  const handleBackToMyPets = () => {
    router.push('/pages/my-pets');
  };

  return (
    <>
      <Navbar />
      {/* Main Pet Card */}
      <div className="flex flex-col items-center justify-center overflow-hidden">
        {/* Simple Pet Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="mb-6 flex flex-col items-center"
        >
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-primary shadow-lg">
            {imageUrl && imageUrl.trim() !== '' ? (
              <Image
                src={imageUrl}
                alt={name}
                width={128}
                height={128}
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.error('Failed to load pet image:', imageUrl);
                  // Hide the image and show fallback
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            {/* Fallback display - always show if no image or image failed to load */}
            {(!imageUrl || imageUrl.trim() === '') && (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-red-500">
                <span className="text-4xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <h2 className="mt-3 text-2xl font-bold text-primary">{name}</h2>
        </motion.div>
        {/* NFC Image */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-4"
        >
          <Image
            alt="nfc"
            src={assets.nfc}
            width={150}
            height={100}
            className="mx-auto block"
            priority
          />
        </motion.div>

        {/* Content */}
        <div className="mb-8">
          <motion.h1
            className="mt-4 h-10 text-center text-3xl font-semibold text-black"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7,
              scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 }
            }}
          >
            {t('title')}
          </motion.h1>
          <motion.p
            className="text-grey-600 h-9 max-w-56 text-center text-base"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7,
              scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 }
            }}
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Back to My Pets Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mb-8"
        >
          <Button
            onClick={handleBackToMyPets}
            variant="outline"
            className="flex items-center gap-2 px-6 py-3 text-primary border-primary hover:bg-primary hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToMyPets')}
          </Button>
        </motion.div>

        {/* Pet Characters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.7 } }}
          className="relative min-h-[350px] w-full"
        >
          {petCharacters.map((pet) => (
            <motion.img
              key={pet.id}
              src={pet.src} // Fixed: removed extra .src
              alt={pet.alt}
              width={pet.size}
              height={pet.size}
              className="absolute z-50 object-cover"
              style={{
                top: `${pet.top}px`,
                left: `calc(50% - ${pet.right}px)`
              }}
              animate={{
                y: [0, 2, 0, 2, 0],
                rotate: [0, -5, 5, -5, 0],
                transition: {
                  duration: 6,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  delay: 0.1 * pet.id
                }
              }}
            />
          ))}
        </motion.div>
      </div>
    </>
  );
}
