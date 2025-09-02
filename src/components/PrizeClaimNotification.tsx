'use client';

import { motion } from 'framer-motion';
import { Gift, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../lib/utils';

interface PrizeClaimNotificationProps {
  onClose?: () => void;
  onClaim?: () => void;
}

const PrizeClaimNotification: React.FC<PrizeClaimNotificationProps> = ({ 
  onClose,
  onClaim
}) => {
  const [isClosed, setIsClosed] = useState(false);
  const router = useRouter();

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClosed(true);
    if (onClose) {
      onClose();
    }
  };

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClaim) {
      onClaim();
    }
    // Navigate to gifts page
    router.push('/pages/my-gifts');
  };

  if (isClosed) {
    return null;
  }

  return (
    <div className="relative h-22 rounded-2xl transition duration-200 hover:shadow-lg">
      {/* Background with prize styling */}
      <div className={cn(
        "absolute inset-0 rounded-2xl border shadow-sm",
        "border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50"
      )} />

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
          {/* Title with animation */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-lg font-bold text-gray-900"
          >
            🎉 Prize Available!
          </motion.div>
          {/* Message with slight delay */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm text-gray-700"
          >
            You have 30 points! Claim your welcome gift now.
          </motion.div>
          {/* Claim button */}
          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            onClick={handleClaim}
            className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
          >
            Claim Prize →
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
