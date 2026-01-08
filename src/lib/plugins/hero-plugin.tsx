/**
 * Landing Page Hero Plugin
 * Extracted from main page to reduce file size
 */

'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

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
    isTop: false,
    isRight: true,
    isMiddle: true,
    src: petImages.pig,
    alt: 'pig',
    size: 160,
    top: 120,
    right: -20,
    degrees: -13.722
  },
  {
    id: 2,
    isTop: true,
    isRight: false,
    isMiddle: false,
    src: petImages.bunny,
    alt: 'bunny',
    size: 160,
    top: 1,
    right: -61,
    degrees: -11.96
  },
  {
    id: 3,
    isTop: true,
    isRight: true,
    isMiddle: false,
    src: petImages.dino,
    alt: 'dino',
    size: 160,
    top: 10,
    right: 50,
    degrees: 2.283
  },
  {
    id: 4,
    isTop: false,
    isRight: false,
    isMiddle: false,
    src: petImages.duck,
    alt: 'duck',
    size: 160,
    top: 150,
    right: -60,
    degrees: 8.077
  },
  {
    id: 5,
    isTop: false,
    isRight: true,
    isMiddle: false,
    src: petImages.penguin,
    alt: 'penguin',
    size: 160,
    top: 180,
    right: 80,
    degrees: 22.271
  },
  {
    id: 6,
    isTop: false,
    isRight: false,
    isMiddle: true,
    src: petImages.bear,
    alt: 'bear',
    size: 160,
    top: 100,
    right: 0,
    degrees: 5.941
  }
];

export const HeroPlugin = () => {
  const t = useTranslations('pages.HomePage');
  const router = useRouter();
  const { user, loading } = useAuth();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-orange-100 via-red-50 to-transparent pt-32">
      {/* Pet characters */}
      {petCharacters.map((pet) => (
        <motion.div
          key={pet.id}
          style={{
            position: 'absolute',
            top: `${pet.top}px`,
            right: `${pet.right}px`,
            zIndex: pet.isTop ? 5 : 10,
            y: pet.isMiddle ? y : 0,
            rotate: pet.degrees
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: pet.id * 0.1 }}
        >
          <Image
            src={pet.src}
            alt={pet.alt}
            width={pet.size}
            height={pet.size}
            priority={false}
            quality={75}
          />
        </motion.div>
      ))}

      {/* Content */}
      <motion.div
        className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-bold text-gray-900 md:text-6xl">
          {t('title')}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-700 md:text-xl">
          {t('subtitle')}
        </p>

        <div className="mt-8 flex gap-4">
          {!user && !loading ? (
            <>
              <Button
                onClick={() => router.push('/auth')}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                {t('signUp')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/auth')}
              >
                {t('signIn')}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => router.push('/pages/my-pets')}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              {t('getStarted')}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
