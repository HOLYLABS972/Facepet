'use client';

import { motion } from 'framer-motion';
import { Check, Share2 } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useTranslations } from 'next-intl';

interface InviteFriendsCardProps {
  onClose?: () => void;
  onShareSuccess?: () => void; // Callback for when sharing is successful
}

const InviteFriendsCard: React.FC<InviteFriendsCardProps> = ({ onClose, onShareSuccess }) => {
  const t = useTranslations('components.InviteFriendsCard');
  const [shared, setShared] = useState(false);
  const iconSectionWidth = 100; // width reserved for the icon

  const handleShare = async () => {
    // Use the correct website URL
    const shareUrl = 'https://facepet-kappa.vercel.app';
    const shareData = {
      title: t('shareTitle'),
      text: `${t('shareText')} ${shareUrl}`,
      url: shareUrl
    };

    try {
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy the full share text with URL to clipboard
        const fullShareText = `${shareData.text} ${shareData.url}`;
        await navigator.clipboard.writeText(fullShareText);
        toast.success(t('linkCopied'));
      }
      setShared(true);
      // Call the success callback to award points
      if (onShareSuccess) {
        onShareSuccess();
      }
    } catch (err) {
      console.error('Failed to share:', err);
      toast.error(t('shareError'));
    }
  };

  return (
    <div className="relative h-22 rounded-2xl overflow-hidden">
      {/* Non-removable Card */}
      <motion.div
        onClick={handleShare}
        className={cn(
          'relative h-full cursor-pointer rounded-2xl transition duration-200 hover:shadow-lg active:shadow-lg',
          shared && 'pointer-events-none'
        )}
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
          {shared ? (
            <motion.div
              key="check"
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.3, 0, 1, 0.1] }}
              className="flex items-center justify-center"
            >
              <Check className="stroke-black" size={25} />
            </motion.div>
          ) : (
            <div className="flex items-center justify-center">
              <Share2 className="stroke-black" size={25} />
            </div>
          )}
        </div>

        <div className="flex grow flex-col justify-center p-4">
          {/* Title with blur animation */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-primary text-lg font-bold"
          >
            {t('shareTitle')}
          </motion.div>
          {/* Subtitle with slight delay */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm text-black"
          >
            {t('shareText')}
          </motion.div>
        </div>
      </div>
      </motion.div>
    </div>
  );
};

export default InviteFriendsCard;
