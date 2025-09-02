'use client';

import { motion } from 'framer-motion';
import { Coins, X } from 'lucide-react';
import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '../../lib/utils';

interface EarningNotificationProps {
  onClose?: () => void;
  points: number;
  action: 'registration' | 'phoneSetup' | 'addPet' | 'share';
  isVisible: boolean;
}

const EarningNotification: React.FC<EarningNotificationProps> = ({ 
  onClose,
  points,
  action,
  isVisible
}) => {
  const t = useTranslations('components.EarningNotification');
  const iconSectionWidth = 100;

  if (!isVisible) return null;

  const getActionText = () => {
    switch (action) {
      case 'registration':
        return t('registration');
      case 'phoneSetup':
        return t('phoneSetup');
      case 'addPet':
        return t('addPet');
      case 'share':
        return t('share');
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative h-22 rounded-2xl overflow-hidden mb-4"
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
            <Coins className="stroke-black" size={25} />
          </div>
        </div>

        <div className="flex grow flex-col justify-center p-4">
          {/* Title with animation */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-black text-lg font-bold"
          >
            {t('title')}
          </motion.div>
          
          {/* Points earned with slight delay */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm text-black"
          >
            <div className="font-semibold text-green-600">
              +{points} {t('points')} {t('earned')}!
            </div>
            <div className="text-gray-600">
              {getActionText()}
            </div>
          </motion.div>
        </div>

        {/* Close button */}
        {onClose && (
          <div className="flex items-center justify-center p-2">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EarningNotification;
