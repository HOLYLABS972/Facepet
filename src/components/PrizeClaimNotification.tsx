'use client';

import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '../lib/utils';

interface PrizeClaimNotificationProps {
  onClaim?: () => void;
}

const PrizeClaimNotification: React.FC<PrizeClaimNotificationProps> = ({ 
  onClaim
}) => {
  const router = useRouter();
  const t = useTranslations('components.PrizeClaimNotification');

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClaim) {
      onClaim();
    }
    // Navigate to gifts page
    router.push('/pages/my-gifts');
  };

  return (
    <div className="relative h-22 rounded-2xl transition duration-200 hover:shadow-lg">
      {/* Background with same styling as other notifications */}
      <div className={cn(
        "absolute inset-0 rounded-2xl border shadow-sm",
        "border-blue-200 bg-blue-50"
      )} />

      {/* Content */}
      <div className="relative z-10 flex h-full">
        <div className="flex grow flex-col justify-center p-4">
          {/* Title with animation */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-lg font-bold text-gray-900"
          >
            {t('title')}
          </motion.div>
          {/* Message with slight delay */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm text-gray-700"
          >
            {t('message')}
          </motion.div>
          {/* Claim button */}
          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            onClick={handleClaim}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {t('claimButton')} →
          </motion.button>
        </div>

        {/* Gift icon overlay */}
        <div
          className={cn(
            'flex items-center justify-center',
            'w-20 h-full'
          )}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl"
          >
            🎁
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PrizeClaimNotification;
