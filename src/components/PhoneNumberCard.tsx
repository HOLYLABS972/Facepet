'use client';

import { motion, PanInfo } from 'framer-motion';
import { Check, Plus, Trash2 } from 'lucide-react';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const iconSectionWidth = 100; // width reserved for the icon

  const handleAddPhone = () => {
    if (onOpenBottomSheet) {
      onOpenBottomSheet();
    }
  };

  const handleClose = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsClosed(true);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      handleClose();
    }
  };

  if (isClosed) {
    return null;
  }

  return (
    <div className="relative h-22 rounded-2xl overflow-hidden">
      {/* Delete Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isDeleting ? 1 : 0 }}
        className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4"
      >
        <Trash2 className="w-6 h-6 text-white" />
      </motion.div>

      {/* Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ 
          x: isDeleting ? -300 : 0,
          opacity: isDeleting ? 0 : 1
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onClick={handleAddPhone}
        className="relative h-full cursor-pointer rounded-2xl transition duration-200 hover:shadow-lg active:shadow-lg"
      >
        {/* Glass morphism background */}
        <div className="border-gray absolute inset-0 rounded-2xl border bg-white shadow-sm" />

      {/* Content */}
      <div className="relative z-10 flex h-full">
        {/* Leading Icon */}
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
      </div>
      </motion.div>
    </div>
  );
};

export default PhoneNumberCard;
