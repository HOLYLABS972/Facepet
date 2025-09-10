import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Image from 'next/image';
import React from 'react';
import { cn } from '../lib/utils';
import { PawPrint } from 'lucide-react';

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
          {pet.imageUrl && pet.imageUrl !== '/default-pet.png' && !pet.imageUrl.includes('default') ? (
            <Image
              src={pet.imageUrl}
              alt={pet.name}
              width={704}
              height={448}
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-[448px] w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <PawPrint className="h-24 w-24 text-gray-400" />
            </div>
          )}

          <div className="absolute bottom-0 w-full">
            <div
              className={cn(
                'h-32 w-full opacity-50',
                pet.imageUrl && pet.imageUrl.includes('figures')
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
