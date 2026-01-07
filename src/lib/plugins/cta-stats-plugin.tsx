/**
 * CTA & Stats Plugins - Extracted from landing page
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/routing';
import CountUp from 'react-countup';

export const StatsPlugin = () => {
  const t = useTranslations('pages.HomePage');
  const locale = useLocale();

  const stats = [
    { key: 'users', value: 5000 },
    { key: 'pets', value: 15000 },
    { key: 'services', value: 500 },
    { key: 'cities', value: 50 }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-orange-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.key}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <div className="text-4xl font-bold text-primary mb-2">
                <CountUp end={stat.value} duration={2} separator="," />
                {stat.key === 'cities' && '+'}
              </div>
              <p className="text-gray-700">
                {t(`stats.${stat.key}`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const CTAPlugin = () => {
  const t = useTranslations('pages.HomePage');
  const router = useRouter();

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('cta.description')}
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90"
            onClick={() => router.push('/add-pet')}
          >
            {t('cta.button')}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
