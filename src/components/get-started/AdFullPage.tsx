'use client';

import { AnimatePresence, motion } from 'framer-motion';
// Removed IKVideo import - using regular video element instead
import { X } from 'lucide-react';
import Image from 'next/image';
import process from 'process';
import { useEffect, useState, useRef } from 'react';
import { Button } from '../ui/button';
import { getYouTubeVideoId } from '@/lib/utils/youtube';

const AdFullPage = ({
  type,
  time,
  content,
  youtubeUrl,
  onClose
}: {
  type: 'image' | 'video' | 'youtube';
  time: number;
  content: string;
  youtubeUrl?: string;
  onClose: () => void;
}) => {
  const [countdown, setCountdown] = useState(time);
  const [adClosed, setAdClosed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Ensure video autoplays
  useEffect(() => {
    if (type === 'video' && videoRef.current) {
      const video = videoRef.current;
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Error playing video:', error);
        });
      }
    }
  }, [type, content]);

  // Notify parent when ad is closed
  useEffect(() => {
    if (adClosed) {
      onClose();
    }
  }, [adClosed, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] h-screen w-screen overflow-hidden bg-black ad-full-page"
        data-no-track
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close Button (top right) */}
        <Button
          variant="ghost"
          className="mix-blend-ifference absolute top-4 right-4 z-[10000] h-9 w-9 rounded-full hover:bg-white"
          onClick={closeAd}
          data-no-track
        >
          <X className="h-4 w-4 stroke-white mix-blend-difference" />
        </Button>
        {/* Countdown (top left) */}
        <motion.div
          className="absolute top-4 left-4 z-[10000] h-9 w-9 items-center justify-center rounded-full text-center mix-blend-difference hover:bg-white"
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
        ) : type === 'youtube' ? (
          youtubeUrl ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(youtubeUrl)}?autoplay=1&mute=1&controls=1&rel=0&enablejsapi=1&playsinline=1`}
                title="YouTube advertisement"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </div>
          ) : null
        ) : type === 'video' ? (
          content ? (
            <video
              ref={videoRef}
              src={content}
              className="absolute inset-0 w-full h-full object-contain"
              autoPlay
              muted
              playsInline
              loop
              controls={false}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          ) : null
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
};

export default AdFullPage;
