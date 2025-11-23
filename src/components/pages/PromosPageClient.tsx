'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Promo, Business } from '@/types/promo';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface PromosPageClientProps {
  promos: Promo[];
  business: Business;
}

export default function PromosPageClient({ promos, business }: PromosPageClientProps) {
  const t = useTranslations('pages.PromosPage');
  const router = useRouter();
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            {locale === 'he' ? (
              <ArrowRight className="h-4 w-4 mr-2" />
            ) : (
              <ArrowLeft className="h-4 w-4 mr-2" />
            )}
            {t('back') || 'Back'}
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            {business.imageUrl && (
              <div className="w-16 h-16 rounded-lg overflow-hidden">
                <img 
                  src={business.imageUrl} 
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{business.name}</h1>
              <p className="text-gray-600">{t('title') || 'Promos & Coupons'}</p>
            </div>
          </div>
        </div>

        {/* Promos List */}
        {promos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('noPromos') || 'No Promos Available'}
              </h3>
              <p className="text-gray-500">
                {t('noPromosDescription') || 'This business doesn\'t have any active promos at the moment.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promos.map((promo) => (
              <Card key={promo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {promo.imageUrl && (
                  <div className="relative w-full h-48">
                    <img
                      src={promo.imageUrl}
                      alt={promo.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{promo.name}</h3>
                  {promo.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{promo.description}</p>
                  )}
                  {(promo.startDate || promo.endDate) && (
                    <div className="text-sm text-gray-500 mb-4">
                      {promo.startDate && (
                        <p>{t('startDate') || 'Start'}: {new Date(promo.startDate).toLocaleDateString()}</p>
                      )}
                      {promo.endDate && (
                        <p>{t('endDate') || 'End'}: {new Date(promo.endDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

