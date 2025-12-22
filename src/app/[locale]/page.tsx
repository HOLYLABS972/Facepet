'use client';

import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/routing';
import { motion, useScroll, useTransform } from 'motion/react';
import { useTranslations } from 'next-intl';
import CountUp from 'react-countup';
import { useAuth } from '@/src/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Image from 'next/image';

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
      <section className="relative mt-16 px-4 sm:px-7 pt-16 sm:pt-32 pb-0 min-h-[600px] overflow-visible w-full">
        <div className="relative max-w-7xl mx-auto">
          {/* Pet Icons Around Text - all 6 pets in horizontal oval */}
          {petCharacters.map((pet, index) => (
            <AnimatedPetAroundText key={pet.id} pet={pet} index={index} />
          ))}

          <div className="relative z-10">
            <div className="text-center text-3xl lg:text-4xl pt-4 mt-[180px] sm:mt-[100px]">
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

// Component for pets around text section - arranged in horizontal oval
const AnimatedPetAroundText = ({ pet, index }: AnimatedPetProps) => {
  const [isFalling, setIsFalling] = useState(false);
  const [hasFallen, setHasFallen] = useState(false);
  
  // Detect mobile - initialize correctly to avoid flash
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });
  
  // Update on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Calculate floor position (bottom of section)
  const floorPosition = 500;

  let baseX: number;
  let baseY: number;

  if (isMobile) {
    // Mobile: Circular positioning above and around the text/button
    const circleRadius = 100; // Distance from center
    const centerX = -15; // Shift slightly left to compensate for padding
    const centerY = -280; // Move up significantly to be above the text

    // Arrange in a circle
    const angleStep = (2 * Math.PI) / 6; // 6 pets evenly distributed
    const startAngle = -Math.PI / 2; // Start from top (12 o'clock position)
    const angle = startAngle + (index * angleStep);

    baseX = centerX + circleRadius * Math.cos(angle);
    baseY = centerY + circleRadius * Math.sin(angle);
  } else {
    // Desktop: Oval positioning
    const ovalWidth = 450;
    const ovalHeight = 200;
    const centerX = -50;
    const centerY = -50;

    const angleStep = (2 * Math.PI) / 6;
    const startAngle = 0;
    const angle = startAngle + (index * angleStep);

    baseX = centerX + ovalWidth * Math.cos(angle);
    baseY = centerY + ovalHeight * Math.sin(angle);
  }
  
  // Responsive pet size
  const responsiveSize = isMobile ? pet.size * 0.5 : pet.size; // 50% size on mobile
  
  // Create smooth floating animation around the oval position
  const baseMovement = 15;
  const floatingPath = {
    y: [
      0,
      -baseMovement * 0.8 + (pet.id % 3) * 3,
      baseMovement * 0.6 - (pet.id % 2) * 2,
      -baseMovement * 0.4 + (pet.id % 4) * 2,
      baseMovement * 0.3 - (pet.id % 3) * 1.5,
      0
    ],
    x: [
      0,
      baseMovement * 0.5 + (pet.id % 2) * 2,
      -baseMovement * 0.4 - (pet.id % 3) * 1.5,
      baseMovement * 0.3 + (pet.id % 2) * 1.5,
      -baseMovement * 0.2 - (pet.id % 2) * 1,
      0
    ],
    rotate: [
      0,
      -10 + (pet.id % 3) * 4,
      8 - (pet.id % 2) * 5,
      -6 + (pet.id % 4) * 3,
      5 - (pet.id % 3) * 2,
      0
    ],
    scale: [
      1,
      1.05 + (pet.id % 3) * 0.02,
      0.95 - (pet.id % 2) * 0.02,
      1.03 + (pet.id % 2) * 0.015,
      0.97 - (pet.id % 3) * 0.015,
      1
    ]
  };
  
  // Falling animation when tapped
  const fallingPath = {
    y: floorPosition - baseY, // Fall to floor
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
  
  return (
    <motion.img
      src={pet.src}
      alt={pet.alt}
      width={responsiveSize}
      height={responsiveSize}
      className="object-cover cursor-pointer"
      style={{
        position: 'absolute',
        top: hasFallen ? `${floorPosition}px` : `calc(50% + ${baseY}px)`,
        left: `calc(50% + ${baseX}px)`,
        transform: 'translate(-50%, -50%)',
        willChange: 'transform',
        zIndex: 1
      }}
      animate={hasFallen ? { y: 0, x: 0, rotate: 0, scale: 1 } : (isFalling ? fallingPath : floatingPath)}
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
              duration: 8 + (pet.id % 3) * 2, // Vary duration between 8-12 seconds
              ease: [0.4, 0, 0.2, 1], // Smooth easing
              repeat: Infinity,
              delay: 0.2 * pet.id, // Stagger delays
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
