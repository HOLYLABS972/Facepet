'use client';

import { useDirection } from '@radix-ui/react-direction';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import React from 'react';
import { cn } from '../lib/utils';

interface MyPetCardProps {
  id: string;
  name: string;
  breed: string;
  image: string;
  type?: string;
  onTap?: (petId: string) => void;
}

const MyPetCard: React.FC<MyPetCardProps> = ({
  id,
  name,
  breed,
  image,
  type,
  onTap
}) => {
  const direction = useDirection();

  // Fixed dimensions for consistent layout.
  const imageWidth = 100; // in pixels
  const cardHeight = 100; // in pixels

  // State to track if image has loaded.
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Handle card tap to open bottom sheet
  const handleCardClick = () => {
    if (onTap) {
      onTap(id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        `bg-primary relative h-[100px] cursor-pointer rounded-2xl shadow-md transition duration-200 hover:shadow-lg active:shadow-lg`
      )}
    >
      {/* Animated Text / Info Container */}
      <motion.div
        className="absolute top-0 bottom-0 z-10 rounded-2xl bg-white shadow-xs ltr:left-0 rtl:right-0"
        initial={{ width: '100%', x: 0 }}
        animate={
          imageLoaded
            ? {
                width: `calc(100% - ${imageWidth}px + 10px)`,
                x: 0
              }
            : { width: '100%', x: 0 }
        }
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex items-start justify-between">
            <div className="text-lg font-bold">{name}</div>
            {type && (
              <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 ml-2">
                {type}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">{breed}</div>
        </div>

        {/* Call-to-Action Arrow Overlay */}
        <div className="absolute top-0 bottom-0 z-20 flex items-end justify-center pb-4 ltr:right-0 rtl:left-0" style={{ marginRight: '20px' }}>
          <ArrowRight className="h-4 w-4 stroke-gray-600 rtl:rotate-180" />
        </div>
      </motion.div>

      {/* Pet Image Container */}
      <div
        className="absolute top-0 bottom-0 ltr:right-0 rtl:left-0"
        style={{ width: `${imageWidth}px` }}
      >
        {image && image !== '/default-pet.png' ? (
          <Image
            src={image}
            alt={name}
            width={imageWidth}
            height={cardHeight}
            loading="lazy"
            className="h-full w-full rounded-e-2xl bg-gray-200 object-cover"
            onLoad={handleImageLoad}
            onError={() => {
              console.log('Image failed to load:', image);
              setImageLoaded(true); // Still show the card even if image fails
            }}
          />
        ) : (
          <div className="h-full w-full rounded-e-2xl bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-2xl">🐾</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPetCard;
