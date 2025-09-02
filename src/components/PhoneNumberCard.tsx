'use client';

import { motion } from 'framer-motion';
import { Check, Phone, X } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface PhoneNumberCardProps {
  onClose?: () => void;
}

const PhoneNumberCard: React.FC<PhoneNumberCardProps> = ({ onClose }) => {
  const [added, setAdded] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const iconSectionWidth = 100; // width reserved for the icon

  const handleAddPhone = async () => {
    try {
      // Here you would implement the actual phone number addition logic
      // For now, we'll just simulate the action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAdded(true);
      toast.success('Phone number added successfully!');
    } catch (err) {
      console.error('Failed to add phone number:', err);
      toast.error('Failed to add phone number');
    }
  };

  return (
    <div
      onClick={handleAddPhone}
      className={cn(
        'relative h-22 cursor-pointer rounded-2xl transition duration-200 hover:shadow-lg active:shadow-lg',
        added && 'pointer-events-none'
      )}
    >
      {/* Glass morphism background */}
      <div className="border-gray absolute inset-0 rounded-2xl border bg-white shadow-sm" />

      {/* Content */}
      <div className="relative z-10 flex h-full">
        <div className="flex grow flex-col justify-center p-4">
          {/* Title with blur animation */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-primary text-lg font-bold"
          >
            Add Phone Number
          </motion.div>
          {/* Subtitle with slight delay */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm text-black"
          >
            Receive our newsletter with pet care tips and updates!
          </motion.div>
        </div>

        {/* Icon overlay */}
        <div
          className={cn(
            'flex items-center justify-center',
            `w-[${iconSectionWidth}px]`
          )}
        >
          {added ? (
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
              <Phone className="stroke-black" size={25} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberCard;
