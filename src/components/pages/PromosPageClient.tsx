'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Tag, CheckCircle2, History, MapPin, QrCode, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Promo, Business } from '@/types/promo';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { isPromoUsed, getUserUsedPromos, UserPromo } from '@/lib/firebase/user-promos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getYouTubeThumbnailUrl, getYouTubeEmbedUrl } from '@/lib/utils/youtube';
import MapCard from '@/components/cards/MapCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PromosPageClientProps {
  promos: Promo[];
  business: Business | null;
  businesses?: Business[];
}

export default function PromosPageClient({ promos, business, businesses = [] }: PromosPageClientProps) {
  const t = useTranslations('pages.PromosPage');
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();
  const [usedPromoIds, setUsedPromoIds] = useState<Set<string>>(new Set());
  const [usedPromos, setUsedPromos] = useState<UserPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  // Function to load used promos
  const loadUsedPromos = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Check which of the current promos are used
      const usedSet = new Set<string>();
      await Promise.all(
        promos.map(async (promo) => {
          const used = await isPromoUsed(user.uid, promo.id);
          if (used) {
            usedSet.add(promo.id);
          }
        })
      );
      setUsedPromoIds(usedSet);

      // Get all used promos for history
      const usedPromosResult = await getUserUsedPromos(user.uid);
      console.log('Used promos result:', usedPromosResult);
      if (usedPromosResult.success && usedPromosResult.promos) {
        console.log(`Setting ${usedPromosResult.promos.length} used promos`);
        setUsedPromos(usedPromosResult.promos);
      } else {
        console.error('Failed to get used promos:', usedPromosResult.error);
        setUsedPromos([]);
      }
    } catch (error) {
      console.error('Error checking used promos:', error);
      setUsedPromos([]);
    } finally {
      setLoading(false);
    }
  }, [user, promos]);

  // Check which promos are used and load used promos
  useEffect(() => {
    loadUsedPromos();
  }, [loadUsedPromos]);

  // Refresh when returning to the page (e.g., after using a coupon)
  useEffect(() => {
    const handleFocus = () => {
      if (user && activeTab === 'history') {
        loadUsedPromos();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, activeTab, loadUsedPromos]);

  const handleViewQR = (promo: Promo) => {
    const url = business
      ? `/${locale}/promos/${promo.id}?businessId=${business.id}`
      : `/${locale}/promos/${promo.id}`;
    router.push(url);
  };


  const handleShowMap = (promo: Promo) => {
    const promoBusinesses = getPromoBusinesses(promo);
    if (promoBusinesses.length > 0) {
      // Pass all business IDs as comma-separated query parameter
      const businessIds = promoBusinesses.map(b => b.id).join(',');
      router.push(`/${locale}/services?businessId=${businessIds}`);
    } else {
      // If no businesses, just go to services page
      router.push(`/${locale}/services`);
    }
  };

  const getPromoBusinesses = (promo: Promo): Business[] => {
    const businessIds = promo.businessIds || (promo.businessId ? [promo.businessId] : []);
    return businesses.filter(b => businessIds.includes(b.id));
  };

  // Refresh used promos when tab changes to history
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (value === 'history' && user) {
      loadUsedPromos();
    }
  }, [user, loadUsedPromos]);

  // Filter out used coupons from available list
  const availablePromos = promos.filter(promo => !usedPromoIds.has(promo.id));

  const renderPromoCard = (promo: Promo) => (
    <Card
      key={promo.id}
      className="overflow-hidden hover:shadow-lg transition-shadow relative flex flex-col"
    >
      {promo.youtubeUrl ? (
        <div className="relative w-full h-48">
          {getYouTubeThumbnailUrl(promo.youtubeUrl) ? (
            <img
              src={getYouTubeThumbnailUrl(promo.youtubeUrl) || ''}
              alt={promo.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Video</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* Date Overlay */}
          {promo.endDate && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-2">
              <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                <Calendar className="h-4 w-4" />
                <span>{t('endDate') || 'End'}: {new Date(promo.endDate).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-GB')}</span>
              </div>
            </div>
          )}
        </div>
      ) : promo.imageUrl && (
        <div className="relative w-full h-48">
          <img
            src={promo.imageUrl}
            alt={promo.name}
            className="w-full h-full object-cover"
          />
          {/* Date Overlay */}
          {promo.endDate && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-2">
              <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                <Calendar className="h-4 w-4" />
                <span>{t('endDate') || 'End'}: {new Date(promo.endDate).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-GB')}</span>
              </div>
            </div>
          )}
        </div>
      )}
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{promo.name}</h3>
          {!business && (() => {
            const promoBusinesses = getPromoBusinesses(promo);
            if (promoBusinesses.length > 0) {
              return (
                <div className="text-sm text-gray-500 mb-2">
                  {promoBusinesses.length === 1
                    ? promoBusinesses[0].name
                    : `${promoBusinesses.length} ${t('businesses') || 'Businesses'}`
                  }
                </div>
              );
            }
            return null;
          })()}
          {promo.description && (
            <p className="text-gray-600 mb-4 line-clamp-3">{promo.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewQR(promo)}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>{t('showQRCode') || 'QR Code'}</span>
          </Button>
          {getPromoBusinesses(promo).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShowMap(promo)}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              <span>{t('showMap') || 'Map'}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderUsedPromoCard = (userPromo: UserPromo) => (
    <Card
      key={userPromo.id}
      className="overflow-hidden hover:shadow-lg transition-shadow relative opacity-75 flex flex-col"
    >
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-gray-500 text-white px-2 py-1 rounded text-xs font-medium">
          {t('used') || 'Used'}
        </div>
      </div>
      {userPromo.promo.youtubeUrl ? (
        <div className="relative w-full h-48">
          {getYouTubeThumbnailUrl(userPromo.promo.youtubeUrl) ? (
            <img
              src={getYouTubeThumbnailUrl(userPromo.promo.youtubeUrl) || ''}
              alt={userPromo.promo.name}
              className="w-full h-full object-cover grayscale"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center grayscale">
              <span className="text-gray-500">Video</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center opacity-90">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      ) : userPromo.promo.imageUrl && (
        <div className="relative w-full h-48">
          <img
            src={userPromo.promo.imageUrl}
            alt={userPromo.promo.name}
            className="w-full h-full object-cover grayscale"
          />
        </div>
      )}
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{userPromo.promo.name}</h3>
          {!business && (() => {
            const promoBusinesses = getPromoBusinesses(userPromo.promo);
            if (promoBusinesses.length > 0) {
              return (
                <div className="text-sm text-gray-500 mb-2">
                  {promoBusinesses.length === 1
                    ? promoBusinesses[0].name
                    : `${promoBusinesses.length} ${t('businesses') || 'Businesses'}`
                  }
                </div>
              );
            }
            return null;
          })()}
          {userPromo.promo.description && (
            <p className="text-gray-600 mb-4 line-clamp-3">{userPromo.promo.description}</p>
          )}
          {userPromo.usedAt && (
            <p className="text-xs text-gray-500 mb-4">
              {t('usedOn') || 'Used on'}: {new Date(userPromo.usedAt).toLocaleDateString('en-GB')}
            </p>
          )}
        </div>
        {/* Action Buttons for used promos */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewQR(userPromo.promo)}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>{t('showQRCode') || 'QR Code'}</span>
          </Button>
          {getPromoBusinesses(userPromo.promo).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShowMap(userPromo.promo)}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              <span>{t('showMap') || 'Map'}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          {business && (
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
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {business?.imageUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <img
                    src={business.imageUrl}
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">
                  {business ? business.name : (t('allPromos') || 'All Promos')}
                </h1>
                <p className="text-gray-600">
                  {business ? (t('title') || 'Promos & Vouchers') : (t('allPromosDescription') || 'Browse all available promos')}
                </p>
              </div>
            </div>
            {business && (
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/promos`)}
                className="flex items-center gap-2"
              >
                <Tag className="w-4 h-4" />
                {t('showAllCoupons') || 'Show All Coupons'}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs for Available and History */}
        {user ? (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="available">
                <Tag className="w-4 h-4 mr-2" />
                {t('available') || 'Available'}
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="w-4 h-4 mr-2" />
                {t('history') || 'History'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : availablePromos.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t('noPromos') || 'No Coupons Available'}
                    </h3>
                    <p className="text-gray-500">
                      {business
                        ? (t('noPromosDescription') || 'This business doesn\'t have any active coupons at the moment.')
                        : (t('noPromosAllDescription') || 'There are no active coupons available at the moment.')
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePromos.map(renderPromoCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : usedPromos.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t('noHistory') || 'No History'}
                    </h3>
                    <p className="text-gray-500">
                      {t('noHistoryDescription') || 'You haven\'t used any coupons yet.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {usedPromos.map(renderUsedPromoCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          /* Show all promos if user is not logged in */
          promos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('noPromos') || 'No Coupons Available'}
                </h3>
                <p className="text-gray-500">
                  {business
                    ? (t('noPromosDescription') || 'This business doesn\'t have any active coupons at the moment.')
                    : (t('noPromosAllDescription') || 'There are no active coupons available at the moment.')
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promos.map(renderPromoCard)}
            </div>
          )
        )}
      </div>
    </div>
  );
}

