'use client';

import { AnimatePresence, motion } from 'framer-motion';
// Removed IKVideo import - using regular video element instead
import { X } from 'lucide-react';
import Image from 'next/image';
import process from 'process';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

const AdFullPage = ({
  type,
  time,
  content,
  onClose
}: {
  type: 'image' | 'video';
  time: number;
  content: string;
  onClose: () => void;
}) => {
  const [countdown, setCountdown] = useState(time);
  const [adClosed, setAdClosed] = useState(false);

  const closeAd = () => {
    document.body.style.overflow = 'visible';
    setAdClosed(true);
  };

  // Start a countdown timer
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          closeAd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      // Restore body overflow when component unmounts
      document.body.style.overflow = '';
    };
  }, []);

  // Notify parent when ad is closed
  useEffect(() => {
    if (adClosed) {
      onClose();
    }
  }, [adClosed, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-50 h-full w-full overflow-hidden bg-black"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close Button (top right) */}
        <Button
          variant="ghost"
          className="mix-blend-ifference absolute top-4 right-4 z-60 h-9 w-9 rounded-full hover:bg-white"
          onClick={closeAd}
        >
          <X className="h-4 w-4 stroke-white mix-blend-difference" />
        </Button>
        {/* Countdown (top left) */}
        <motion.div
          className="absolute top-4 left-4 h-9 w-9 items-center justify-center rounded-full text-center mix-blend-difference hover:bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="h-full w-full content-center text-xl text-white mix-blend-difference">
            {countdown}
          </p>
        </motion.div>
        {type === 'image' ? (
          content ? (
            <Image
              className="h-full w-full object-contain"
              src={content}
              alt="advertisement"
              width={1200}
              height={800}
              loading="eager"
              priority={true}
            />
          ) : null
        ) : type === 'video' ? (
          content ? (
            <video
              src={content}
              className="w-full"
              autoPlay
              muted
              playsInline
              loop
            />
          ) : null
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
};

export default AdFullPage;
