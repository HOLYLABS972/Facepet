'use client';

import { useState, useEffect } from 'react';
import { getContactInfo } from '@/src/lib/actions/admin';
import { ShoppingBag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function FloatingStoreButton() {
  const t = useTranslations('components.Navbar');
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreUrl = async () => {
      try {
        const contactInfo = await getContactInfo();
        console.log('FloatingStoreButton - Contact info:', contactInfo);
        if (contactInfo?.storeUrl) {
          console.log('FloatingStoreButton - Setting store URL:', contactInfo.storeUrl);
          setStoreUrl(contactInfo.storeUrl);
        } else {
          console.log('FloatingStoreButton - No store URL found');
        }
      } catch (error) {
        console.error('Error fetching store URL:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreUrl();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleStoreClick = () => {
    if (storeUrl) {
      window.open(storeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if loading, no store URL, or user closed the button
  console.log('FloatingStoreButton render check:', { isLoading, storeUrl, isVisible });
  if (isLoading || !storeUrl || !isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999]"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{
            type: 'spring',
            bounce: 0.4,
            duration: 0.6
          }}
        >
          <div className="relative">
            {/* Main Store Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStoreClick}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-medium transition-colors duration-200"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{t('store')}</span>
            </motion.button>

            {/* Close Button (X) */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="absolute -top-2 -right-2 bg-gray-600 hover:bg-gray-700 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
