'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
    top: 50,
    right: 0,
    isRight: false
  },
  {
    id: 2,
    src: petImages.bunny,
    alt: 'bunny',
    size: 133,
    top: 50,
    right: -61,
    isRight: false
  },


  {
    id: 5,
    src: petImages.penguin,
    alt: 'penguin',
    size: 152,
    top: 10,
    right: 234,
    isRight: true
  },
  {
    id: 6,
    src: petImages.pig,
    alt: 'pig',
    size: 167,
    top: 10,
    right: 140,
    isRight: true
  }
];

// Animated pet component with flying and tap-to-fall
const AnimatedPet = ({ pet }: { pet: typeof petCharacters[0] }) => {
  const [isFalling, setIsFalling] = useState(false);
  const [hasFallen, setHasFallen] = useState(false);
  
  const isLeftSide = !pet.isRight;
  
  // Position pets closer around text/logo - more centered
  // Reduced distances to bring pets closer to the NFC logo and text block
  const cornerDistance = 180; // Reduced from 250 - closer to center
  const bottomDistance = 180; // Reduced from 250 - closer to center
  
  // Calculate positions for corners (45-degree angles)
  // Top corners and bottom pets closer together
  let verticalPosition = 50;
  let horizontalDistance = 0;
  
  // Position pets at corners with 45-degree angles - closer to center
  if (pet.id === 2) {
    // Top-left corner (45 degrees) - higher and more left
    verticalPosition = -cornerDistance * 1.8; // Higher up
    horizontalDistance = -cornerDistance * 1.0; // Closer together
  } else if (pet.id === 3) {
    // Top-right corner (45 degrees) - closer
    verticalPosition = -cornerDistance;
    horizontalDistance = cornerDistance;
  } else if (pet.id === 4) {
    // Additional pet - top-left extended - higher and more left
    verticalPosition = -cornerDistance * 1.5; // Higher up
    horizontalDistance = -cornerDistance * 1.1; // Closer together
  } else if (pet.id === 5) {
    // Additional pet - top-right extended - higher and more right
    verticalPosition = -cornerDistance * 1.6; // Higher up
    horizontalDistance = cornerDistance * 1.0; // Closer together
  } else if (pet.id === 1) {
    // Bottom-left - more space and lower
    verticalPosition = 180; // Moved much further down
    horizontalDistance = -bottomDistance * 0.9; // Much more space between pets
  } else if (pet.id === 6) {
    // Bottom-right - more space and lower
    verticalPosition = 180; // Moved much further down
    horizontalDistance = bottomDistance * 0.9; // Much more space between pets
  }
  
  const floorPosition = 600;
  const baseMovement = 12;
  const repulsionDistance = 25;
  
  // Calculate horizontal position based on corner distance
  // For left side (negative horizontalDistance), use left positioning
  // For right side (positive horizontalDistance), use right positioning
  const isLeftCorner = horizontalDistance < 0;
  
  const flyingPath = {
    y: [
      0, 
      -baseMovement - (pet.id % 3) * 3, 
      baseMovement + (pet.id % 2) * 4, 
      -baseMovement * 0.6 + (pet.id % 4) * 2, 
      baseMovement * 0.4 - (pet.id % 3) * 1.5,
      0
    ],
    x: [
      0, 
      (isLeftCorner ? repulsionDistance : -repulsionDistance) + (pet.id % 2) * 4,
      (isLeftCorner ? -repulsionDistance : repulsionDistance) * 0.6 - (pet.id % 3) * 2, 
      (isLeftCorner ? repulsionDistance : -repulsionDistance) * 0.8 + (pet.id % 2) * 3, 
      (isLeftCorner ? -repulsionDistance : repulsionDistance) * 0.4 - (pet.id % 2) * 1.5,
      0
    ],
    rotate: [
      0, 
      -15 + (pet.id % 3) * 5, 
      12 - (pet.id % 2) * 7, 
      -10 + (pet.id % 4) * 4, 
      8 - (pet.id % 3) * 3,
      0
    ],
    scale: [
      1, 
      1.08 + (pet.id % 3) * 0.03,
      0.92 - (pet.id % 2) * 0.03,
      1.05 + (pet.id % 2) * 0.02, 
      0.95 - (pet.id % 3) * 0.02,
      1
    ]
  };
  
  const fallingPath = {
    y: floorPosition - (verticalPosition + 200), // Adjust for center-based positioning
    x: 0,
    rotate: 360 + (pet.id % 2 === 0 ? 180 : 0),
    scale: [1, 0.9, 1]
  };
  
  const handleTap = () => {
    if (!isFalling && !hasFallen) {
      setIsFalling(true);
      setTimeout(() => {
        setIsFalling(false);
        setHasFallen(true);
      }, 2000);
    }
  };
  
  // For bottom pets (1 and 6), position right after the button
  const isBottomPet = pet.id === 1 || pet.id === 6;
  // Button is approximately 350px from top (NFC + name + title + subtitle + button + margins)
  const buttonBottomPosition = 480; // Positioned much further down below the button
  
  return (
    <motion.img
      src={pet.src}
      alt={pet.alt}
      width={pet.size}
      height={pet.size}
      className="absolute z-10 object-cover cursor-pointer pointer-events-auto"
      style={{
        top: hasFallen 
          ? `${floorPosition}px` 
          : (isBottomPet ? `${buttonBottomPosition}px` : `calc(50% + ${verticalPosition}px)`),
        ...(isLeftCorner
          ? { left: `calc(50% + ${horizontalDistance}px)` }
          : { right: `calc(50% - ${horizontalDistance}px)` }),
        willChange: 'transform'
      }}
      animate={hasFallen ? { y: 0, x: 0, rotate: 0, scale: 1 } : (isFalling ? fallingPath : flyingPath)}
      transition={
        isFalling
          ? {
              duration: 1.5,
              ease: [0.55, 0.085, 0.68, 0.53],
              scale: {
                duration: 0.3,
                delay: 1.2,
                ease: 'easeOut'
              }
            }
          : {
              duration: 10 + (pet.id % 4) * 2,
              ease: [0.4, 0, 0.2, 1],
              repeat: Infinity,
              delay: 0.3 * pet.id,
              repeatType: 'reverse'
            }
      }
      onTap={handleTap}
      onClick={handleTap}
    />
  );
};

interface DonePageProps {
  name: string;
  imageUrl: string;
}

export default function DonePage({ name, imageUrl }: DonePageProps) {
  const t = useTranslations('pages.DonePage');
  const router = useRouter();
  const locale = useLocale();
  
  // Debug: Log the values to see what we're getting
  console.log('DonePage props:', { name, imageUrl });

  const handleBackToMyPets = () => {
    router.push(`/${locale}/coupons`);
  };

  return (
    <>
      <Navbar />
      {/* Main Pet Card */}
      <div className="relative mt-16 px-4 sm:px-7 py-8 min-h-[600px] overflow-visible max-w-7xl mx-auto flex items-center justify-center">
        {/* Pet Characters - positioned around text */}
        {petCharacters.map((pet) => (
          <AnimatedPet key={pet.id} pet={pet} />
        ))}

        {/* Content Section - centered with pets around it */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl">
          {/* NFC Image */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-4 flex justify-center"
          >
            <Image
              alt="nfc"
              src={assets.nfc}
              width={150}
              height={100}
              className="block"
              priority
            />
          </motion.div>
          {/* Pet Name */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="mb-6 text-center"
          >
            <h2 className="text-2xl font-bold text-primary">{name}</h2>
          </motion.div>

          {/* Content */}
          <div className="mb-8 flex flex-col items-center w-full">
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
              className="text-grey-600 h-9 max-w-56 text-center text-base mx-auto"
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
        </div>
      </div>
    </>
  );
}
