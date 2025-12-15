'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ShoppingCart, Share2, MapPin, Phone, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { UserCoupon } from '@/lib/firebase/user-coupons';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Business } from '@/types/promo';
import toast from 'react-hot-toast';
import { useShopRedirect } from '@/hooks/use-shop-redirect';
import QRCodeCard from '@/components/cards/QRCodeCard';
import MapCard from '@/components/cards/MapCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


interface VoucherViewPageClientProps {
  userCoupon: UserCoupon;
  businesses?: Business[];
}

export default function VoucherViewPageClient({ userCoupon, businesses = [] }: VoucherViewPageClientProps) {
  const t = useTranslations('components.UserCoupons');
  const router = useRouter();
  const locale = useLocale();
  const coupon = userCoupon.coupon;

  // Debug: Log businesses prop
  useEffect(() => {
    console.log('🔍 VoucherViewPageClient - businesses prop:', {
      count: businesses.length,
      businesses: businesses.map(b => ({ id: b.id, name: b.name }))
    });
  }, [businesses]);
  const { redirectToShop } = useShopRedirect();
  const [shopUrl, setShopUrl] = useState<string>('');
  const [voucherUrl, setVoucherUrl] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showMapDialog, setShowMapDialog] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Set voucher URL only on client side to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      setVoucherUrl(`${window.location.origin}/${locale}/vouchers/${userCoupon.id}`);
    }
  }, [locale, userCoupon.id]);

  useEffect(() => {
    const fetchContactData = async () => {
      const { getContactInfo } = await import('@/lib/actions/admin');
      const info = await getContactInfo();
      if (info?.storeUrl) {
          setShopUrl(info.storeUrl);
      }
    };
    fetchContactData();
  }, []);


  const handleUse = () => {
    const couponCode = coupon.description; // The coupon code is stored in description
    
    // Copy the code first
    if (couponCode) {
      navigator.clipboard.writeText(couponCode).then(() => {
        toast.success(t('codeCopied') || 'Voucher code copied to clipboard!');
      }).catch(() => {
        toast.error(t('failedToCopy') || 'Failed to copy code');
      });
    }
    
    // Then redirect to shop with the coupon code
    if (!shopUrl) {
      toast.error('Shop URL is not configured. Please contact support.');
      return;
    }
    
    redirectToShop(shopUrl, couponCode, undefined, true);
  };

  const handleShare = async () => {
    if (!isMounted || !voucherUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: coupon.name,
          text: coupon.description || coupon.name,
          url: voucherUrl,
        });
        toast.success(t('sharedSuccessfully') || 'Shared successfully!');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          // Fallback to clipboard
          navigator.clipboard.writeText(voucherUrl);
          toast.success(t('linkCopied') || 'Link copied to clipboard!');
        }
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(voucherUrl);
      toast.success(t('linkCopied') || 'Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6"
        >
          {locale === 'he' ? (
            <ArrowRight className="h-4 w-4 mr-2" />
          ) : (
            <ArrowLeft className="h-4 w-4 mr-2" />
          )}
          {t('back') || 'Back'}
        </Button>

        <Card className="overflow-hidden">
          <CardContent className="p-8">
            {/* Voucher Image */}
            {coupon.imageUrl && (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                <img
                  src={coupon.imageUrl}
                  alt={coupon.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Voucher Info */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">{coupon.name}</h1>
              {coupon.description && (
                <p className="text-gray-600 mb-4">{coupon.description}</p>
              )}
              {coupon.validFrom && coupon.validTo && isMounted && (
                <div className="text-sm text-gray-500 mb-4">
                  <p>{t('validFrom') || 'Valid from'}: {new Date(coupon.validFrom).toLocaleDateString('en-GB')}</p>
                  <p>{t('validUntil') || 'Valid until'}: {new Date(coupon.validTo).toLocaleDateString('en-GB')}</p>
                </div>
              )}
            </div>

            {/* Businesses that accept this voucher */}
            {businesses.length > 0 ? (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  {t('acceptedAt')} ({businesses.length})
                </h2>
                <div className="space-y-4">
                  {businesses.map((biz) => (
                    <Card 
                      key={biz.id} 
                      className="border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedBusiness(biz);
                        setShowMapDialog(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {biz.imageUrl && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={biz.imageUrl}
                                alt={biz.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-2">{biz.name}</h3>
                            {biz.description && (
                              <p className="text-sm text-gray-600 mb-3">{biz.description}</p>
                            )}
                            <div className="space-y-1 text-sm text-gray-600">
                              {biz.contactInfo?.address && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <span>{biz.contactInfo.address}</span>
                                </div>
                              )}
                              {biz.contactInfo?.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 flex-shrink-0" />
                                  <a 
                                    href={`tel:${biz.contactInfo.phone}`}
                                    className="hover:text-primary transition-colors"
                                  >
                                    {biz.contactInfo.phone}
                                  </a>
                                </div>
                              )}
                              {biz.contactInfo?.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <a 
                                    href={`mailto:${biz.contactInfo.email}`}
                                    className="hover:text-primary transition-colors"
                                  >
                                    {biz.contactInfo.email}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {businesses.length > 0 && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full mt-4"
                    onClick={() => {
                      setSelectedBusiness(null);
                      setShowMapDialog(true);
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('showMap') || 'Show Map'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {t('noBusinessesFound') || 'No businesses found for this voucher. This may be a data issue.'}
                </p>
              </div>
            )}

            {/* QR Code Card */}
            <div className="mb-8">
              <QRCodeCard 
                url={voucherUrl} 
                description={t('qrCodeDescription') || 'Scan this QR code to view this voucher'}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="default"
                size="lg"
                onClick={handleUse}
                className="flex-1"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t('use') || 'Use'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleShare}
                className="flex-1"
                disabled={!isMounted || !voucherUrl}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('share') || 'Share'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Map Dialog */}
        <Dialog open={showMapDialog} onOpenChange={(open) => {
          setShowMapDialog(open);
          if (!open) {
            setSelectedBusiness(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedBusiness 
                  ? `${t('mapFor') || 'Map for'} ${selectedBusiness.name}`
                  : t('showMap') || 'Show Map'}
              </DialogTitle>
            </DialogHeader>
            {selectedBusiness ? (
              <MapCard businesses={[selectedBusiness]} />
            ) : businesses.length > 0 ? (
              <MapCard businesses={businesses} />
            ) : (
              <div className="p-4 text-center text-gray-500">
                {t('noBusinessesFound') || 'No businesses found for this voucher'}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

