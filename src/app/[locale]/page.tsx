'use client';

import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/routing';
import { motion, useScroll, useTransform } from 'motion/react';
import { useTranslations } from 'next-intl';
import CountUp from 'react-countup';
import { useAuth } from '@/src/contexts/AuthContext';
import { useState } from 'react';

// Pet images - using public paths for Next.js Image component
const petImages = {
  bear: '/pets/bear.png',
  bunny: '/pets/bunny.png',
  dino: '/pets/dino.png',
  duck: '/pets/duck.png',
  penguin: '/pets/penguin.png',
  pig: '/pets/pig.png'
};
import Footer from '@/src/components/layout/Footer';
import CookieConsent from '@/src/components/CookieConsent';

const petCharacters = [
  {
    id: 1,
    isTop: false,
    isRight: true,
    isMiddle: true,
    src: petImages.pig,
    alt: 'pig',
    size: 167,
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
    size: 163,
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
    size: 198,
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
    size: 185,
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
    size: 152,
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
    size: 143,
    top: 100,
    right: 0,
    degrees: 5.941
  }
];

export default function LandingHomePage() {
  const t = useTranslations('pages.HomePage');
  const router = useRouter();
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex grow flex-col">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCookieAccept = () => {
    console.log('Cookies accepted');
  };

  const handleCookieReject = () => {
    console.log('Cookies rejected');
  };

  return (
    // This container is scrollable. Adjust the height as needed.
    <div className="flex grow flex-col">
      {/* Navbar */}
      <Navbar />
      
      {/* Always show the public landing page */}
      <PublicLandingPage t={t} router={router} />
      
      {/* Cookie Consent */}
      <CookieConsent 
        onAccept={handleCookieAccept}
        onReject={handleCookieReject}
      />
    </div>
  );
}

// Public Landing Page Component
const PublicLandingPage = ({ t, router }: { t: any; router: any }) => {
  const tHome = useTranslations('pages.HomePage');
  return (
    <>
      {/* Main Welcome Content */}
      <section className="relative mt-16 px-4 sm:px-7 pt-8 pb-0 min-h-[600px] overflow-visible max-w-7xl mx-auto">
        {/* Pet Icons Around Text - using existing petCharacters */}
        {petCharacters
          .filter(pet => pet.id !== 4 && pet.id !== 5) // Remove duck (4) and penguin (5)
          .map((pet, index) => (
            <AnimatedPetAroundText key={pet.id} pet={pet} index={index} />
          ))}

        <div className="relative z-10">
          <div className="text-center text-3xl lg:text-4xl pt-4">
            <p className="text-gray-500">{t('upperTitle')}</p>
            <p className="text-black">{t('lowerTitle')}</p>
          </div>

          {/* Mobile Get Started Button */}
          <div className="mt-8 flex justify-center sm:hidden">
            <Button
              onClick={() => router.push('/auth')}
              className="h-[48px] w-auto px-8 bg-primary hover:bg-primary hover:opacity-70 rounded-full text-sm font-normal shadow-lg flex items-center justify-center"
            >
              {t('buttonLabel')}
            </Button>
          </div>

          {/* Desktop Get Started Button */}
          <div className="mt-8 hidden w-full items-center justify-center sm:flex">
            <Button
              onClick={() => router.push('/auth')}
              className="bg-primary hover:bg-primary h-16 w-52 rounded-full text-sm font-normal shadow-lg hover:opacity-70"
            >
              {t('buttonLabel')}
            </Button>
          </div>
        </div>
      </section>

      {/* Product Highlights Section */}
      <div className="relative w-full">
        <div className="sm:hidden">
          <ProductHighlights />
        </div>
      </div>
      <div className="hidden sm:block">
        <ProductHighlights />
      </div>
      <Footer />
    </>
  );
};

type Pet = {
  id: number;
  isTop: boolean;
  isMiddle: boolean;
  isRight: boolean;
  src: any;
  alt: string;
  size: number;
  top: number;
  right: number;
  degrees: number;
};

type AnimatedPetProps = {
  pet: Pet;
  index: number;
};

// Component for pets around text section
const AnimatedPetAroundText = ({ pet }: AnimatedPetProps) => {
  const [isFalling, setIsFalling] = useState(false);
  const [hasFallen, setHasFallen] = useState(false);
  
  // Position pets on left and right sides, distributed top to bottom
  const isLeftSide = !pet.isRight;
  
  // Distribute pets vertically with more space: 4 at top (2 on each side), 2 below
  // Left side: bunny (top-1), bear (top-2), duck (bottom)
  // Right side: dino (top-1), pig (top-2), penguin (bottom)
  let verticalPosition = pet.top;
  let horizontalOffset = 0;
  
  // Adjust vertical positions - 2 at top, 4 in middle layer
  // Equal spacing between all pets to prevent touching
  // Spacing: 180px between each layer
  const topLayer = -40;
  const middleTopLayer = topLayer + 180; // 140px
  const middleBottomLayer = middleTopLayer + 180; // 320px
  
  if (isLeftSide) {
    if (pet.id === 2) {
      verticalPosition = topLayer; // bunny - top
      horizontalOffset = 0;
    } else if (pet.id === 4) {
      verticalPosition = middleTopLayer; // duck - middle-top
      horizontalOffset = -20;
    } else if (pet.id === 6) {
      verticalPosition = middleBottomLayer; // bear - middle-bottom
      horizontalOffset = 30;
    }
  } else {
    if (pet.id === 3) {
      verticalPosition = topLayer; // dino - top
      horizontalOffset = 0;
    } else if (pet.id === 5) {
      verticalPosition = middleTopLayer; // penguin - middle-top
      horizontalOffset = 20;
    } else if (pet.id === 1) {
      verticalPosition = middleBottomLayer; // pig - middle-bottom
      horizontalOffset = -30;
    }
  }
  
  // Calculate floor position (bottom of section)
  const floorPosition = 500; // Position at bottom of section
  
  // Create dynamic flying paths with collapse/repulsion effect
  // Different animation controls for middle pets (they're far from center)
  const isMiddlePet = verticalPosition === middleTopLayer;
  const baseMovement = isMiddlePet ? 25 : 12; // Larger movement for middle pets
  const repulsionDistance = isMiddlePet ? 120 : 25; // Much larger horizontal movement for middle pets
  
  const flyingPath = {
    y: [
      0, 
      -baseMovement - (pet.id % 3) * (isMiddlePet ? 8 : 3), 
      baseMovement + (pet.id % 2) * (isMiddlePet ? 10 : 4), 
      -baseMovement * 0.6 + (pet.id % 4) * (isMiddlePet ? 5 : 2), 
      baseMovement * 0.4 - (pet.id % 3) * (isMiddlePet ? 4 : 1.5),
      0
    ],
    x: isLeftSide 
      ? isMiddlePet
        ? [
            1500, // Start from off-screen (far left)
            800, // Move into view
            400, // Continue moving right
            600, // Slight left
            500, // Settle position
            400 // Final position in view
          ]
        : [
            0, 
            repulsionDistance + (pet.id % 2) * 4,
            -repulsionDistance * 0.6 - (pet.id % 3) * 2, 
            repulsionDistance * 0.8 + (pet.id % 2) * 3, 
            -repulsionDistance * 0.4 - (pet.id % 2) * 1.5,
            0
          ]
      : isMiddlePet
        ? [
            -1500, // Start from off-screen (far right)
            -800, // Move into view
            -400, // Continue moving left
            -600, // Slight right
            -500, // Settle position
            -400 // Final position in view
          ]
        : [
            0, 
            -repulsionDistance - (pet.id % 2) * 4,
            repulsionDistance * 0.6 + (pet.id % 3) * 2, 
            -repulsionDistance * 0.8 - (pet.id % 2) * 3, 
            repulsionDistance * 0.4 + (pet.id % 2) * 1.5,
            0
          ],
    rotate: [
      0, 
      -15 - (isMiddlePet ? 10 : 0) + (pet.id % 3) * 5, 
      12 + (isMiddlePet ? 8 : 0) - (pet.id % 2) * 7, 
      -10 - (isMiddlePet ? 5 : 0) + (pet.id % 4) * 4, 
      8 + (isMiddlePet ? 5 : 0) - (pet.id % 3) * 3,
      0
    ],
    scale: [
      1, 
      1.08 + (pet.id % 3) * (isMiddlePet ? 0.05 : 0.03), // More scale variation for middle pets
      0.92 - (pet.id % 2) * (isMiddlePet ? 0.05 : 0.03), // Scale down (collapse effect)
      1.05 + (pet.id % 2) * (isMiddlePet ? 0.04 : 0.02), 
      0.95 - (pet.id % 3) * (isMiddlePet ? 0.04 : 0.02),
      1
    ]
  };
  
  // Falling animation when tapped
  const fallingPath = {
    y: floorPosition - verticalPosition, // Fall to floor
    x: 0,
    rotate: 360 + (pet.id % 2 === 0 ? 180 : 0), // Spin while falling
    scale: [1, 0.9, 1] // Slight bounce on impact
  };
  
  const handleTap = () => {
    if (!isFalling && !hasFallen) {
      setIsFalling(true);
      
      // After falling animation completes, keep pet on floor
      setTimeout(() => {
        setIsFalling(false);
        setHasFallen(true);
      }, 2000);
    }
  };
  
  // Calculate responsive horizontal position based on layer
  // Middle pets: really far from text (only ones that need to be far)
  // Bottom pets: close together
  let distanceFromCenter = 320; // Top layer: default distance
  
  if (verticalPosition === middleTopLayer) {
    // Middle-top pets (duck, penguin): really far from text - starting position more left/right
    distanceFromCenter = 2000;
  } else if (verticalPosition === middleBottomLayer) {
    // Middle-bottom pets (bear, pig): close together
    distanceFromCenter = 240;
  }
  
  // For middle pets, allow them to start from outside screen
  const horizontalPosition = isLeftSide 
    ? (verticalPosition === middleTopLayer 
        ? `calc(50% - ${distanceFromCenter}px)` // Middle pets: start from left off-screen
        : `clamp(10px, calc(50% - ${distanceFromCenter}px), 20px)`) // Other pets: clamped
    : (verticalPosition === middleTopLayer 
        ? `calc(50% + ${distanceFromCenter}px)` // Middle pets: start from right off-screen
        : `clamp(10px, calc(50% - ${distanceFromCenter}px), 20px)`); // Other pets: clamped
  
  return (
    <motion.img
      src={pet.src}
      alt={pet.alt}
      width={pet.size}
      height={pet.size}
      className="object-cover cursor-pointer"
      style={{
        position: 'absolute',
        top: hasFallen ? `${floorPosition}px` : `${verticalPosition}px`,
        ...(isLeftSide
          ? { left: horizontalPosition }
          : { right: horizontalPosition }),
        willChange: 'transform',
        zIndex: 1
      }}
      animate={hasFallen ? { y: 0, x: 0, rotate: 0, scale: 1 } : (isFalling ? fallingPath : flyingPath)}
      transition={
        isFalling
          ? {
              duration: 1.5,
              ease: [0.55, 0.085, 0.68, 0.53], // Ease out for gravity effect
              scale: {
                duration: 0.3,
                delay: 1.2,
                ease: 'easeOut'
              }
            }
          : {
              duration: 10 + (pet.id % 4) * 2, // Vary duration between 10-16 seconds
              ease: [0.4, 0, 0.2, 1], // Custom easing for smoother collapse effect
              repeat: Infinity,
              delay: 0.3 * pet.id, // Stagger delays more
              repeatType: 'reverse'
            }
      }
      onTap={handleTap}
      onClick={handleTap}
    />
  );
};

const AnimatedPet = ({ pet }: AnimatedPetProps) => {
  // Use the containerRef to track scroll inside that container.
  const { scrollY } = useScroll();
  const xLargeScreen = 300;
  const yChangeValue = 600;
  const xChangeValue = 650;
  // Map scroll range [0, 1200] to a horizontal offset.
  const offsetY = pet.isTop ? -100 : pet.isMiddle ? 0 : yChangeValue;
  const offsetX = pet.isRight
    ? pet.isMiddle
      ? -xChangeValue - 700
      : -xChangeValue
    : pet.isMiddle
      ? xChangeValue + 500
      : xChangeValue;

  const x = useTransform(scrollY, [0, 2000], [0, offsetX]);
  const y = useTransform(scrollY, [0, 2000], [0, offsetY]);

  return (
    <motion.img
      src={pet.src} // Fixed: removed extra .src
      alt={pet.alt}
      width={pet.size}
      height={pet.size}
      className="object-cover"
      style={{
        x,
        y,
        position: 'absolute',
        top: `calc(${pet.top}px)`,
        ...(pet.isRight
          ? {
              right: `calc(50% + ${pet.right}px)`
            }
          : {
              left: `calc(50% - ${pet.right}px)`
            }),
        willChange: 'transform'
      }}
      animate={{
        rotate: [0, -5, 5, -5, 0], // Rotating effect
        transition: {
          duration: 6,
          ease: 'easeInOut',
          repeat: Infinity,
          delay: 0.1 * pet.id
        }
      }}
    />
  );
};

const ProductHighlights = () => {
  const t = useTranslations('components.ProductHighlights');

  return (
    <section className="mt-0 mb-0">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ amount: 0.8 }}
        className="mx-auto max-w-4xl px-4 text-center pt-0"
      >
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-primary mb-4 text-4xl font-bold"
        >
          {t('headline')}
        </motion.h2>

        {/* Subheading / Engaging Text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-4 text-lg text-gray-700"
        >
          {t('subheading')}
        </motion.p>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <StatItem end={2651} label={t('recoveredPets')} duration={2.5} />
          <StatItem end={122} label={t('activeUsers')} duration={2.5} />
          <StatItem end={24981} label={t('chipsDeployed')} duration={2.5} />
        </div>
      </motion.div>
    </section>
  );
};

type StatItemProps = {
  end: number;
  label: string;
  duration: number;
};

const StatItem = ({ end, label, duration }: StatItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true }}
    className="flex flex-col items-center"
  >
    <CountUp
      start={0}
      end={end}
      duration={duration}
      separator=","
      className="text-primary text-4xl font-extrabold"
    />
    <p className="mt-2 text-xl font-semibold">{label}</p>
  </motion.div>
);
