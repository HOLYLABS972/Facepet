'use client';

import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/routing';
import { motion, useScroll, useTransform } from 'motion/react';
import { useTranslations } from 'next-intl';
import CountUp from 'react-countup';
import { useAuth } from '@/src/contexts/AuthContext';

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
      <section className="mt-16 px-7">

        
        <h1 className="text-primary py-4 text-center font-['Lobster'] text-5xl tracking-wide lg:text-7xl">
          FacePet
        </h1>

        <div className="text-center text-3xl lg:text-4xl">
          <p className="text-gray-500">{t('upperTitle')}</p>
          <p className="text-black">{t('lowerTitle')}</p>
        </div>

        {/* <div className="mt-12">
          <Button
            onClick={() => router.push('/auth')}
            className="w-full h-[60px] bg-primary hover:bg-primary hover:opacity-70 rounded-full text-sm font-normal shadow-lg"
          >
            Get Started
          </Button>
        </div> */}
      </section>

      {/* Animated Pet Characters */}
      <div className="relative min-h-[350px] w-full overflow-hidden md:overflow-visible">
        {/* Product Highlights Section */}
        <div className="mt-20 lg:mt-32">
          <div className="sm:hidden">
            <ProductHighlights />
          </div>
          <div className="hidden w-full items-center justify-center sm:flex">
            <Button
              onClick={() => router.push('/how-it-works')}
              className="bg-primary hover:bg-primary h-16 w-52 rounded-full text-sm font-normal shadow-lg hover:opacity-70"
            >
              {t('buttonLabel')}
            </Button>
          </div>
        </div>
        {petCharacters.map((pet, index) => (
          <AnimatedPet key={pet.id} pet={pet} index={index} />
        ))}
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
    <section className="my-16">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ amount: 0.8 }}
        className="mx-auto max-w-4xl px-4 text-center"
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
          className="mb-12 text-lg text-gray-700"
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
