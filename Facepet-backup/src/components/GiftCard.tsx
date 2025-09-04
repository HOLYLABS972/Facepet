'use client';

import confetti from 'canvas-confetti';
import { animate, motion, useMotionValue } from 'framer-motion';
import { Check, MousePointerClickIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface GiftCardProps {
  id: string;
  value: number;
  valueText: string;
  title: string;
  description: string;
  isCollected?: boolean;
}

// A helper component to animate the number counting up.
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const motionValue = useMotionValue(0);
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 2,
      onUpdate: (latest) => setCurrentValue(Math.floor(latest))
    });
    return controls.stop;
  }, [value, motionValue]);

  return <span>{currentValue}</span>;
};

const GiftCard: React.FC<GiftCardProps> = ({
  id,
  value,
  valueText,
  title,
  description,
  isCollected = false
}) => {
  const [collected, setCollected] = useState(isCollected);

  // Fixed dimensions for layout, similar to pet card.
  const coinCounterWidth = 100; // Left section width in pixels.

  const handleCardClick = () => {
    if (!collected) {
      setCollected(true);
      confetti({
        particleCount: 100,
        spread: 70
      });
      // Additional logic (like calling an API) can be added here.
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'relative h-[100px] cursor-pointer rounded-2xl transition duration-200 hover:shadow-lg active:shadow-lg',
        // Disable pointer events if already collected.
        collected ? 'pointer-events-none shadow-none' : 'shadow-md'
      )}
    >
      {/* Background container changes color based on collected state */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl',
          collected ? 'bg-gray-400 shadow-sm' : 'bg-primary shadow-md'
        )}
      />

      {/* Animated Text / Info Container */}
      <motion.div
        className={cn(
          'absolute top-0 bottom-0 z-10 rounded-2xl bg-white ltr:left-0 rtl:right-0',
          collected ? 'shadow-none' : 'shadow-xs'
        )}
        initial={{ width: '100%' }}
        animate={{
          width: `calc(100% - ${coinCounterWidth}px)`
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <div className="flex h-full w-full">
          <div className="flex h-full grow flex-col justify-between py-4 ps-4">
            <div className="line-clamp-2 leading-tight font-bold">{title}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>

          {/* Icon Overlay: Displays a click icon or a check when collected */}
          {collected ? (
            <motion.div
              key="check"
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.3, 0, 1, 0.1] }}
              className="flex items-center justify-center p-4"
            >
              <Check className="stroke-gray-600" size={25} />
            </motion.div>
          ) : (
            <div className="flex items-center justify-center p-4">
              <MousePointerClickIcon className="stroke-gray-600" size={25} />
            </div>
          )}
        </div>
      </motion.div>

      {/* Animated white coin counter container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: collected ? 0.5 : 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        className={cn(
          'absolute top-0 bottom-0 flex flex-col items-center justify-center ltr:right-0 rtl:left-0',
          `w-[${coinCounterWidth}px]`
        )}
      >
        <div className="text-4xl font-bold text-white">
          <AnimatedNumber value={value} />
        </div>
        <div className="text-xl text-white">{valueText}</div>
      </motion.div>
    </div>
  );
};

export default GiftCard;
