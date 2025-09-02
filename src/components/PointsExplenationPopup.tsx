'use client';

import { motion } from 'framer-motion';
import { Award, Share2, Star, X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './ui/button';

/**
 * PointsExplenationPopup displays a multi-phase explanation popup with animations and icons.
 *
 * @param onClose - Callback to close the popup.
 */
const PointsExplenationPopup: React.FC<{ onClose: () => void }> = ({
  onClose
}) => {
  const t = useTranslations('components.PointsExplenationPopup');
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const phases = [
    {
      icon: <Share2 size={60} className="mx-auto block" />,
      title: t('phases.share.title'),
      text: t('phases.share.text'),
      position: 'right'
    },
    {
      icon: <Star size={60} className="mx-auto block" />,
      title: t('phases.earn.title'),
      text: t('phases.earn.text'),
      position: 'left'
    },
    {
      icon: <Award size={60} className="mx-auto block" />,
      title: t('phases.benefits.title'),
      text: t('phases.benefits.text'),
      position: 'right'
    }
  ];

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-blue-400/10 bg-clip-padding backdrop-blur-xs backdrop-filter">
      <motion.div
        className="mx-4 rounded-lg bg-white p-8 text-center shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <X
          className="-m-2 cursor-pointer stroke-gray-600"
          onClick={() => onClose()}
        />
        <div className="space-y-10 py-4 pb-6">
          {phases.map((phase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.5, duration: 0.5 }}
              className={`flex items-center gap-4 ${
                phase.position === 'right' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className="flex-shrink-0">{phase.icon}</div>
              <div className="text-left rtl:text-right">
                <h2 className="text-2xl font-bold">{phase.title}</h2>
                <p>{phase.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (phases.length + 1) * 0.5, duration: 0.5 }}
        >
          <Button onClick={onClose}>{t('understood')}</Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PointsExplenationPopup;
