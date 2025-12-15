'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Share, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import toast from 'react-hot-toast';

const ShareMenu = () => {
  const t = useTranslations('components.ShareButton');
  const [menuOpen, setMenuOpen] = useState(false);

  // For the "copy link" option.
  const handleCopyLink = async () => {
    // Get the current page URL and title safely
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: t('title'),
      text: `${t('text')} ${shareUrl}`,
      url: shareUrl
    };

    try {
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard
          .writeText(shareData.text + ' ' + shareData.url)
          .then(() => {
            toast.success(t('linkCopied'));
          })
          .catch(() => {
            toast.error('something went wrong');
          });
      }
      setMenuOpen(false);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="relative">
      {/* Main share button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <Button
          size="lg"
          type="button"
          onClick={handleCopyLink}
          className="bg-primary fixed bottom-20 md:bottom-4 z-70 h-[60px] w-[60px] rounded-full p-0 hover:bg-[#ff6243]/90 ltr:right-4 rtl:left-4"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Share className="h-6 w-6" />}
        </Button>
      </motion.div>
    </div>
  );
};

export default ShareMenu;
