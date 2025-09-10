'use client';

import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Gift, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from '../i18n/routing';
import { Button } from './ui/button';

/**
 * Props for GiftPopup component.
 */
interface GiftPopupProps {
  onClose: () => void;
  title: string;
  text: string;
  buttonText: string;
}

/**
 * GiftPopup displays a confetti animation, a congratulatory message,
 * and a button to navigate to the gifts page.
 *
 * @param onClose - Callback to close the popup.
 * @param title - Customizable title text.
 * @param text - Customizable body text.
 * @param buttonText - Customizable button text.
 */
const GiftPopup: React.FC<GiftPopupProps> = ({
  onClose,
  title,
  text,
  buttonText
}) => {
  const router = useRouter();
  const [isLoading, SetIsLoading] = useState(false);
  // Fire confetti on mount.
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    document.body.style.overflow = 'hidden';

    return () => {
      // Re-enable scrolling when the popup unmounts
      document.body.style.overflow = '';
    };
  }, []);

  const handleButtonClick = () => {
    SetIsLoading(true);
    router.push('/pages/my-gifts'); // Adjust path to your gifts page.
  };

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-blue-400/10 bg-clip-padding backdrop-blur-xs backdrop-filter">
      <motion.div
        className="rounded-lg bg-white p-8 text-center shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <X className="-m-2 stroke-gray-600" onClick={() => onClose()} />
        <Gift size={60} className="mx-auto block" />
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>
        <p className="mb-6">{text}</p>
        <Button onClick={handleButtonClick}>
          {isLoading ? <Loader2 className="animate-spin" /> : buttonText}
        </Button>
      </motion.div>
    </div>
  );
};

export default GiftPopup;
