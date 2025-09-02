'use client';

// Pet images - using public paths for Next.js Image component
const petImages = {
  bear: '/pets/bear.png',
  bunny: '/pets/bunny.png',
  dino: '/pets/dino.png',
  duck: '/pets/duck.png',
  penguin: '/pets/penguin.png',
  pig: '/pets/pig.png'
};
import { motion } from 'framer-motion';
import React from 'react';

const petCharacters = [
  {
    id: 1,
    src: petImages.bear,
    alt: 'bear',
    size: 143,
    top: 100,
    right: 0,
    degrees: 5.941
  },
  {
    id: 2,
    src: petImages.bunny,
    alt: 'bunny',
    size: 163,
    top: 1,
    right: -61,
    degrees: -11.96
  },
  {
    id: 3,
    src: petImages.dino,
    alt: 'dino',
    size: 198,
    top: 10,
    right: 250,
    degrees: 2.283
  },
  {
    id: 4,
    src: petImages.duck,
    alt: 'duck',
    size: 185,
    top: 150,
    right: -60,
    degrees: 8.077
  },
  {
    id: 5,
    src: petImages.penguin,
    alt: 'penguin',
    size: 152,
    top: 180,
    right: 234,
    degrees: 22.271
  },
  {
    id: 6,
    src: petImages.pig,
    alt: 'pig',
    size: 167,
    top: 120,
    right: 140,
    degrees: -13.722
  }
];

const AnimatedPetCharacters: React.FC = () => {
  return (
    <div className="relative min-h-[350px] w-full overflow-hidden">
      {petCharacters.map((pet) => (
        <motion.img
          src={pet.src.src}
          alt={pet.alt}
          width={pet.size}
          height={pet.size}
          className="object-cover"
          key={pet.id}
          style={{
            position: 'absolute',
            top: `${pet.top}px`,
            left: `calc(50% - ${pet.right}px)`,
            willChange: 'transform'
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            y: [0, 2, 0, 2, 0], // Floating effect
            rotate: [0, -3, 3, -3, 0], // Reduced rotation for better performance
            transition: {
              opacity: { duration: 0.5 },
              y: {
                duration: 6,
                ease: 'easeInOut',
                repeat: Infinity,
                delay: 0.1 * pet.id
              },
              rotate: {
                duration: 6,
                ease: 'easeInOut',
                repeat: Infinity,
                delay: 0.1 * pet.id
              }
            }
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedPetCharacters;
