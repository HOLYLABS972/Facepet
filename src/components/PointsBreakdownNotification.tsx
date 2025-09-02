'use client';

import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '../lib/utils';

interface PointsBreakdownNotificationProps {
  onClose?: () => void;
  totalPoints: number;
  registrationPoints: number;
  phonePoints: number;
  petPoints: number;
  onClaimPrize?: () => void;
}

const PointsBreakdownNotification: React.FC<PointsBreakdownNotificationProps> = ({ 
  onClose,
  totalPoints,
  registrationPoints,
  phonePoints,
  petPoints,
  onClaimPrize
}) => {
  const router = useRouter();
  const t = useTranslations('components.PointsBreakdownNotification');
  const iconSectionWidth = 100; // width reserved for the icon

  const handleClaimPrize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClaimPrize) {
      onClaimPrize();
    }
    // Navigate to gifts page
    router.push('/pages/my-gifts');
  };

  return (
    <div className="relative h-22 rounded-2xl overflow-hidden">
      {/* Glass morphism background - same as InviteFriendsCard */}
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
            className="text-primary text-lg font-bold"
          >
            {t('title')}
          </motion.div>
          {/* Points breakdown with slight delay */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm text-black space-y-1"
          >
            <div>{t('registration')}: +{registrationPoints} {t('points')}</div>
            {phonePoints > 0 && <div>{t('phoneSetup')}: +{phonePoints} {t('points')}</div>}
            {petPoints > 0 && <div>{t('addPet')}: +{petPoints} {t('points')}</div>}
            <div className="font-semibold text-primary">{t('total')}: {totalPoints} {t('points')}</div>
            {/* Prize claim button - only show if user has 30+ points */}
            {totalPoints >= 30 && (
              <motion.button
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.3 }}
                onClick={handleClaimPrize}
                className="mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {t('claimPrize')} (30 {t('points')}) →
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PointsBreakdownNotification;
