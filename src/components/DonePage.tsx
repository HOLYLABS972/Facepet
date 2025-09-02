'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
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

  return (
    <>
      <Navbar />
      {/* Main Pet Card */}
      <div className="flex flex-col items-center justify-center overflow-hidden">
        <PetCard pet={{ name, imageUrl }} />
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

        {/* Pet Characters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.7 } }}
          className="relative min-h-[350px] w-full"
        >
          <Image
            alt="nfc"
            src={nfc}
            width={150}
            height={100}
            className="mx-auto block"
          />
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
