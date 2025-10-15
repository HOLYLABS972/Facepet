'use client';

import { useState, useEffect } from 'react';
import { getContactInfo } from '@/src/lib/actions/admin';
import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function FloatingStoreButton() {
  const t = useTranslations('components.Navbar');
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
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

  const handleStoreClick = () => {
    if (storeUrl) {
      window.open(storeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if loading or no store URL
  console.log('FloatingStoreButton render check:', { isLoading, storeUrl });
  if (isLoading || !storeUrl) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-6 z-[9999] ltr:left-6 rtl:right-6"
      style={{
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
