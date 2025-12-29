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
      <section className="relative px-4 sm:px-7 pb-0 min-h-[600px] overflow-visible w-full sm:-mt-[100px]">
        <div className="relative max-w-7xl mx-auto">
          {/* Desktop: Container with text in center and pets around */}
          <div className="hidden sm:flex relative items-center justify-center h-[calc(100vh-4rem)]">
            {/* Desktop: Pet Icons Around Text - all 6 pets in horizontal oval */}
            <div className="absolute inset-0 flex items-center justify-center">
          {petCharacters.map((pet, index) => (
            <AnimatedPetAroundText key={pet.id} pet={pet} index={index} />
          ))}
            </div>

            {/* Text and Button in the center */}
            <div className="relative z-10 text-center mt-[90px]">
              <div className="text-3xl lg:text-4xl">
                <p className="text-gray-500">{t('upperTitle')}</p>
                <p className="text-black">{t('lowerTitle')}</p>
              </div>
              
              {/* Desktop Get Started Button */}
              <div className="mt-8 flex w-full items-center justify-center">
                <Button
                  onClick={() => router.push('/auth')}
                  className="bg-primary hover:bg-primary h-16 w-52 rounded-full text-lg font-normal shadow-lg hover:opacity-70"
                >
                  {t('buttonLabel')}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden relative z-10 mt-16">
            {/* Mobile: 3 Top Pets Before Text */}
            <div className="flex justify-center items-center gap-4 mb-8">
              <AnimatedPetSimple pet={petCharacters[2]} size={80} /> {/* dino */}
              <div className="relative -mt-[50px]">
                <AnimatedPetSimple pet={petCharacters[1]} size={80} /> {/* bunny */}
              </div>
              <AnimatedPetSimple pet={petCharacters[5]} size={80} /> {/* bear */}
            </div>
            
            <div className="text-center text-3xl lg:text-4xl pt-4 mt-[30px]">
              <p className="text-gray-500">{t('upperTitle')}</p>
              <p className="text-black">{t('lowerTitle')}</p>
            </div>

            {/* Mobile Get Started Button */}
            <div className="mt-8 flex justify-center">
              <Button
                onClick={() => router.push('/auth')}
                className="h-[48px] w-auto px-8 bg-primary hover:bg-primary hover:opacity-70 rounded-full text-lg font-normal shadow-lg flex items-center justify-center"
              >
                {t('buttonLabel')}
              </Button>
            </div>

            {/* Mobile: Pet Icons After Button - 3 pets in line (pig, duck, penguin) */}
            <div className="flex justify-center items-center gap-4 mt-16">
              <AnimatedPetSimple pet={petCharacters[0]} size={80} /> {/* pig */}
              <div className="relative mt-[50px]">
                <AnimatedPetSimple pet={petCharacters[3]} size={80} /> {/* duck */}
              </div>
              <AnimatedPetSimple pet={petCharacters[4]} size={80} /> {/* penguin */}
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

// Component for pets around text section - fully static (no animations)
const AnimatedPetAroundText = ({ pet, index }: AnimatedPetProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 640);
    }
  }, []);

  // Calculate position
  let baseX: number;
  let baseY: number;

  if (isMobile) {
    const circleRadius = 120;
    const centerX = -40;
    const centerY = 0;
    const angleStep = (2 * Math.PI) / 6;
    const startAngle = -Math.PI / 2;
    const angle = startAngle + (index * angleStep);

    baseX = centerX + circleRadius * Math.cos(angle);
    baseY = centerY + circleRadius * Math.sin(angle);
  } else {
    const ovalWidth = 500;
    const ovalHeight = 250;
    const centerX = -40;
    const centerY = 0;
    const angleStep = (2 * Math.PI) / 6;
    const startAngle = 0;
    const angle = startAngle + (index * angleStep);

    baseX = centerX + ovalWidth * Math.cos(angle);
    baseY = centerY + ovalHeight * Math.sin(angle);
  }

  const responsiveSize = isMobile ? pet.size * 0.5 : pet.size;

  // Static image - no animations at all
  return (
    <img
      src={pet.src}
      alt={pet.alt}
      width={responsiveSize}
      height={responsiveSize}
      className="object-cover"
      style={{
        position: 'absolute',
        top: `calc(50% + ${baseY}px)`,
        left: `calc(50% + ${baseX}px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1
      }}
    />
  );
};

// Simple pet component for mobile (horizontal layout)
// Fully static on mobile for optimal performance - no animations
const AnimatedPetSimple = ({ pet, size }: { pet: Pet; size: number }) => {
  // Always use static image on mobile for performance
  // Mobile version of this component is already in mobile-only section
  return (
    <img
      src={pet.src}
      alt={pet.alt}
      width={size}
      height={size}
      className="object-contain"
      style={{
        transform: `rotate(${pet.degrees}deg)`,
        transformOrigin: 'center',
      }}
    />
  );
};

const AnimatedPet = ({ pet }: AnimatedPetProps) => {
  // Disable scroll animations on mobile to prevent crashes
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return true; // Default to mobile for safety
  });

  // Only use scroll animations on desktop
  const scrollHook = !isMobile ? useScroll() : null;
  const scrollY = scrollHook?.scrollY || { get: () => 0 };
  
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

  const x = !isMobile ? useTransform(scrollY, [0, 2000], [0, offsetX]) : 0;
  const y = !isMobile ? useTransform(scrollY, [0, 2000], [0, offsetY]) : 0;

  // Use simple img on mobile, motion.img on desktop
  if (isMobile) {
    return (
      <img
        src={pet.src}
        alt={pet.alt}
        width={pet.size}
        height={pet.size}
        className="object-cover"
        style={{
          position: 'absolute',
          top: `calc(${pet.top}px)`,
          ...(pet.isRight
            ? {
                right: `calc(50% + ${pet.right}px)`
              }
            : {
                left: `calc(50% - ${pet.right}px)`
              })
        }}
      />
    );
  }

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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return true;
  });

  // Use simple div on mobile, motion.div on desktop
  const Container = isMobile ? 'div' : motion.div;
  const Heading = isMobile ? 'h2' : motion.h2;
  const Paragraph = isMobile ? 'p' : motion.p;

  const containerProps = isMobile ? {} : {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
    viewport: { amount: 0.8 }
  };

  const headingProps = isMobile ? {} : {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
    viewport: { once: true }
  };

  const paragraphProps = isMobile ? {} : {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.2 },
    viewport: { once: true }
  };

  return (
    <section className="mt-0 mb-0">
      <Container
        {...containerProps}
        className="mx-auto max-w-4xl px-4 text-center pt-0"
      >
        {/* Headline */}
        <Heading
          {...headingProps}
          className="text-primary mb-4 text-4xl font-bold"
        >
          {t('headline')}
        </Heading>

        {/* Subheading / Engaging Text */}
        <Paragraph
          {...paragraphProps}
          className="mb-4 text-lg text-gray-700"
        >
          {t('subheading')}
        </Paragraph>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <StatItem end={2651} label={t('recoveredPets')} duration={2.5} isMobile={isMobile} />
          <StatItem end={122} label={t('activeUsers')} duration={2.5} isMobile={isMobile} />
          <StatItem end={24981} label={t('chipsDeployed')} duration={2.5} isMobile={isMobile} />
        </div>
      </Container>
    </section>
  );
};

type StatItemProps = {
  end: number;
  label: string;
  duration: number;
  isMobile?: boolean;
};

const StatItem = ({ end, label, duration, isMobile = false }: StatItemProps) => {
  const Container = isMobile ? 'div' : motion.div;
  const containerProps = isMobile ? {} : {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
    viewport: { once: true }
  };

  return (
    <Container
      {...containerProps}
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
    </Container>
  );
};
