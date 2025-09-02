'use client';

import { motion } from 'framer-motion';
import { Check, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { useTranslations } from 'next-intl';

interface PhoneNumberCardProps {
  onClose?: () => void;
  onOpenBottomSheet?: () => void;
}

const PhoneNumberCard: React.FC<PhoneNumberCardProps> = ({ onClose, onOpenBottomSheet }) => {
  const t = useTranslations('pages.MyPetsPage');
  const [isClosed, setIsClosed] = useState(false);
  const iconSectionWidth = 100; // width reserved for the icon

  const handleAddPhone = () => {
    if (onOpenBottomSheet) {
      onOpenBottomSheet();
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the add phone action
    setIsClosed(true);
    if (onClose) {
      onClose();
    }
  };

  if (isClosed) {
    return null;
  }

  return (
    <div
      onClick={handleAddPhone}
      className="relative h-22 cursor-pointer rounded-2xl transition duration-200 hover:shadow-lg active:shadow-lg"
    >
      {/* Glass morphism background */}
      <div className="border-gray absolute inset-0 rounded-2xl border bg-white shadow-sm" />

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 z-20 p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>

      {/* Content */}
      <div className="relative z-10 flex h-full">
        <div className="flex grow flex-col justify-center p-4">
          {/* Title with blur animation */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-primary text-lg font-bold"
          >
            {t('addPhoneNumber')}
          </motion.div>
          {/* Subtitle with slight delay */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm text-black"
          >
            {t('phoneNumberDescription')}
          </motion.div>
        </div>

        {/* Icon overlay */}
        <div
          className={cn(
            'flex items-center justify-center',
            `w-[${iconSectionWidth}px]`
          )}
        >
          <div className="flex items-center justify-center">
            <Plus className="stroke-black" size={25} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberCard;
