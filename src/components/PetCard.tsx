import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Image from 'next/image';
import React from 'react';
import { cn } from '../lib/utils';

interface PetCardProps {
  pet: {
    name: string;
    imageUrl: string;
  };
}

const PetCard = React.memo(({ pet }: PetCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.3
      }}
      className="mt-3 flex flex-col items-center justify-center px-4"
    >
      <Card className="relative flex w-full flex-col overflow-hidden rounded-3xl border-none shadow-md">
        <CardContent className="relative p-0">
          {pet.imageUrl && pet.imageUrl.trim() !== '' ? (
            <Image
              src={pet.imageUrl}
              alt={pet.name}
              width={704}
              height={448}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(e) => {
                console.error('Failed to load pet image:', pet.imageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          {/* Fallback for missing image */}
          {(!pet.imageUrl || pet.imageUrl.trim() === '') && (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-red-500">
              <span className="text-6xl font-bold text-white">
                {pet.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="absolute bottom-0 w-full">
            <div
              className={cn(
                'h-32 w-full opacity-50',
                pet.imageUrl.includes('figures')
                  ? 'bg-gradient-to-t from-gray-900 to-transparent'
                  : 'from-primary bg-gradient-to-t to-transparent'
              )}
            />
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-3xl font-bold text-white shadow-2xl">
              {pet.name}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default PetCard;
