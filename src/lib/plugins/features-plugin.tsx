/**
 * Features Plugin - Extracted from landing page
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Heart, MapPin, Bell, Lock } from 'lucide-react';

const features = [
  {
    id: 1,
    icon: Heart,
    key: 'feature1'
  },
  {
    id: 2,
    icon: MapPin,
    key: 'feature2'
  },
  {
    id: 3,
    icon: Bell,
    key: 'feature3'
  },
  {
    id: 4,
    icon: Lock,
    key: 'feature4'
  }
];

export const FeaturesPlugin = () => {
  const t = useTranslations('pages.HomePage');

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {t('features.title')}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                className="p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p className="text-gray-600">
                  {t(`features.${feature.key}.description`)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
