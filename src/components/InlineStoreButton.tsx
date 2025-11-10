'use client';

import { useState, useEffect } from 'react';
import { getContactInfo } from '@/src/lib/actions/admin';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from './ui/button';

interface InlineStoreButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export default function InlineStoreButton({ 
  className = '', 
  variant = 'default',
  size = 'default'
}: InlineStoreButtonProps) {
  const t = useTranslations('components.Navbar');
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreUrl = async () => {
      try {
        const contactInfo = await getContactInfo();
        console.log('InlineStoreButton - Contact info:', contactInfo);
        if (contactInfo?.storeUrl) {
          console.log('InlineStoreButton - Setting store URL:', contactInfo.storeUrl);
          setStoreUrl(contactInfo.storeUrl);
        } else {
          console.log('InlineStoreButton - No store URL found');
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
  console.log('InlineStoreButton render check:', { isLoading, storeUrl });
  if (isLoading || !storeUrl) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        bounce: 0.3,
        duration: 0.5
      }}
      className={className}
    >
      <Button
        onClick={handleStoreClick}
        variant={variant}
        size={size}
        className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
      >
        <ShoppingBag className="w-5 h-5 mr-2" />
        <span>{t('store')}</span>
      </Button>
    </motion.div>
  );
}
