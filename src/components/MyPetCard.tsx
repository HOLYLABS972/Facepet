'use client';

import { useDirection } from '@radix-ui/react-direction';
import { motion } from 'framer-motion';
import { ArrowRight, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface MyPetCardProps {
  id: string;
  name: string;
  breed: string;
  image: string;
  isEditMode: boolean;
}

const MyPetCard: React.FC<MyPetCardProps> = ({
  id,
  name,
  breed,
  image,
  isEditMode
}) => {
  const router = useRouter();
  const direction = useDirection();

  // Fixed dimensions for consistent layout.
  const imageWidth = 100; // in pixels
  const cardHeight = 120; // in pixels, increased for better mobile display
  const optionsPanelWidth = 60; // width of the options panel, reduced for small screens

  // State to track how many images have loaded.
  const [imagesLoaded, setImagesLoaded] = React.useState(0);
  const totalImages = 2;
  const allImagesLoaded = imagesLoaded === totalImages;

  const handleImageLoad = () => {
    setImagesLoaded((prev) => prev + 1);
  };

  // Only navigate when not in edit mode.
  const handleCardClick = () => {
    if (!isEditMode) {
      router.push(`/pet/${id}`);
    }
  };

  // Option button click handlers.
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    console.log('Delete pet', id);
  };

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    router.push(`/pet/${id}/edit`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        `bg-primary relative h-[120px] w-full cursor-pointer rounded-2xl shadow-md transition duration-200 hover:shadow-lg active:shadow-lg overflow-hidden`
      )}
    >
      {/* Options Panel (revealed in edit mode) */}
      <div
        className={cn(
          'absolute top-0 bottom-0 z-10 flex items-center justify-evenly gap-1 rounded-s-2xl p-2.5 ltr:left-0 rtl:right-0'
        )}
        style={{ width: `${optionsPanelWidth}px` }}
      >
        <Button
          variant={'secondary'}
          onClick={handleEdit}
          className="h-[70%] w-full font-medium shadow-none hover:bg-white/20 active:bg-white/20"
        >
          <Pencil className="h-6 w-6" />
        </Button>
        {/* <Separator orientation="vertical" className="h-[70%] bg-white/60" />
        <Button
          variant={'secondary'}
          onClick={handleDelete}
          className="h-[70%] w-3 font-medium shadow-none hover:bg-white/20 active:bg-white/20"
        >
          <Trash2 className="h-6 w-6" />
        </Button> */}
      </div>

      {/* Animated Text / Info Container */}
      <motion.div
        className="absolute top-0 bottom-0 z-10 rounded-2xl bg-white shadow-xs ltr:left-0 rtl:right-0"
        initial={{ width: '100%', x: 0 }}
        animate={
          allImagesLoaded
            ? {
                width: `calc(100% - ${imageWidth}px + 10px)`,
                x: isEditMode
                  ? direction === 'rtl'
                    ? -optionsPanelWidth
                    : optionsPanelWidth
                  : 0
              }
            : { width: '100%', x: 0 }
        }
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div className="text-lg font-bold">{name}</div>
          <div className="text-sm text-gray-600">{breed}</div>
        </div>

        {/* Call-to-Action Arrow Overlay */}
        <div className="absolute top-0 bottom-0 z-20 flex items-center justify-center p-4 ltr:right-0 rtl:left-0">
          <ArrowRight className="h-4 w-4 stroke-gray-600 rtl:rotate-180" />
        </div>
      </motion.div>

      {/* Static Image Container */}
      <div
        className="absolute top-0 bottom-0 ltr:right-0 rtl:left-0"
        style={{ width: `${imageWidth}px` }}
      >
        <div className="flex items-center justify-end">
          {image && image.trim() !== '' ? (
            <>
              <img
                alt={name}
                src={image}
                width={imageWidth}
                height={cardHeight}
                loading="lazy"
                style={{ transform: 'scaleX(-1)' }}
                className="h-full w-full bg-gray-200 object-cover object-center rounded-e-2xl"
                onLoad={handleImageLoad}
                onError={(e) => {
                  console.error('Failed to load pet image:', image);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <img
                alt={name}
                src={image}
                width={imageWidth}
                height={cardHeight}
                loading="lazy"
                className="inset-0 h-full w-full rounded-e-2xl bg-gray-200 object-cover"
                onLoad={handleImageLoad}
                onError={(e) => {
                  console.error('Failed to load pet image:', image);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 rounded-e-2xl">
              <span className="text-4xl font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPetCard;