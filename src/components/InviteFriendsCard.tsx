'use client';

import { motion } from 'framer-motion';
import { Check, Share2, X } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useTranslations } from 'next-intl';

interface InviteFriendsCardProps {
  onClose?: () => void;
}

const InviteFriendsCard: React.FC<InviteFriendsCardProps> = ({ onClose }) => {
  const t = useTranslations('pages.MyPetsPage');
  const [shared, setShared] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const iconSectionWidth = 100; // width reserved for the icon

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClosed(true);
    if (onClose) {
      onClose();
    }
  };

  const handleShare = async () => {
    // Get the current page URL and title safely
    const shareUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const shareData = {
      title: 'הצטרף ל-Facepet',
      text: 'שתף עם חברים וקבל נקודות!',
      url: shareUrl
    };

    try {
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard
          .writeText(shareData.text + '\n' + shareData.url)
          .then(() => {
            toast.success('הלינק הועתק ללוח');
          })
          .catch(() => {
            toast.error('something went wrong');
          });
      }
      setShared(true);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (isClosed) return null;

  return (
    <div
      onClick={handleShare}
      className={cn(
        'relative h-22 cursor-pointer rounded-2xl transition duration-200 hover:shadow-lg active:shadow-lg',
        shared && 'pointer-events-none'
      )}
    >
      {/* Glass morphism background */}
      <div className="border-gray absolute inset-0 rounded-2xl border bg-white shadow-sm" />

      {/* Close Button */}
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-20 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}

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
            {t('shareWithFriends')}
          </motion.div>
          {/* Subtitle with slight delay */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm text-black"
          >
            {t('shareDescription')}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InviteFriendsCard;
