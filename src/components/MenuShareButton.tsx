'use client';

import { Button } from '@/components/ui/button';
import { SiWhatsapp } from '@icons-pack/react-simple-icons';
import { AnimatePresence, motion } from 'framer-motion';
import { Facebook, Link2, Share, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FacebookShareButton, WhatsappShareButton } from 'react-share';

const MenuShareMenu = () => {
  const t = useTranslations('components.ShareButton');
  const [menuOpen, setMenuOpen] = useState(false);

  // Get the current page URL and title safely
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareData = {
    title: t('title'),
    text: t('text'),
    url: shareUrl
  };
  // For the "copy link" option.
  const handleCopyLink = async () => {
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

  // Animation variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Delay between each button's animation
        staggerDirection: -1
      }
    },
    exit: {
      opacity: 1,
      transition: {
        staggerChildren: 0 // Delay between each button's animation
      }
    }
  };

  const itemVariants = (position: number) => ({
    hidden: { y: 72, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.1
      }
    },
    exit: {
      y: 72 * (3 - position),
      opacity: 1,
      transition: {
        duration: 0.1
      }
    }
  });

  // Define share buttons for cleaner rendering
  const shareButtons = [
    {
      id: 'facebook',
      component: (
        <FacebookShareButton
          url={shareUrl}
          title={t('text')}
          hashtag="#facepet"
        >
          <div
            onClick={() => setMenuOpen(false)}
            className="bg-primary flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full p-0 text-white hover:bg-[#ff6243]/90"
          >
            <Facebook className="h-6 w-6" />
          </div>
        </FacebookShareButton>
      )
    },
    {
      id: 'whatsapp',
      component: (
        <WhatsappShareButton url={shareUrl} title={t('text')}>
          <div
            onClick={() => setMenuOpen(false)}
            className="bg-primary flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full p-0 text-white hover:bg-[#ff6243]/90"
          >
            <SiWhatsapp className="h-6 w-6" />
          </div>
        </WhatsappShareButton>
      )
    },
    {
      id: 'copylink',
      component: (
        <Button
          size="lg"
          type="button"
          onClick={handleCopyLink}
          className="bg-primary h-[60px] w-[60px] rounded-full p-0 hover:bg-[#ff6243]/90"
        >
          <Link2 className="h-6 w-6" />
        </Button>
      )
    }
  ];

  return (
    <div className="relative">
      {/* Dark overlay similar to a drawer */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-60 bg-black"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Share menu options */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-22 z-70 flex flex-col items-center space-y-3 ltr:right-4 rtl:left-4"
          >
            {shareButtons.map((button, index) => (
              <motion.div
                key={button.id}
                variants={itemVariants(index)}
                className="z-40"
              >
                {button.component}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main share button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          size="lg"
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="bg-primary fixed bottom-4 z-70 h-[60px] w-[60px] rounded-full p-0 hover:bg-[#ff6243]/90 ltr:right-4 rtl:left-4"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Share className="h-6 w-6" />}
        </Button>
      </motion.div>
    </div>
  );
};

export default MenuShareMenu;
