'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { UserCoupon } from '@/lib/firebase/user-coupons';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { QRCode } from 'react-qr-code';
import toast from 'react-hot-toast';
import { useShopRedirect } from '@/hooks/use-shop-redirect';
import { getContactInfo } from '@/lib/actions/admin';

interface VoucherViewPageClientProps {
  userCoupon: UserCoupon;
}

export default function VoucherViewPageClient({ userCoupon }: VoucherViewPageClientProps) {
  const t = useTranslations('components.UserCoupons');
  const router = useRouter();
  const locale = useLocale();
  const coupon = userCoupon.coupon;
  const { redirectToShop } = useShopRedirect();
  const [shopUrl, setShopUrl] = useState<string>('');
  const [voucherUrl, setVoucherUrl] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Set voucher URL only on client side to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      setVoucherUrl(`${window.location.origin}/${locale}/vouchers/${userCoupon.id}`);
    }
  }, [locale, userCoupon.id]);

  useEffect(() => {
    const fetchShopUrl = async () => {
      const contactInfo = await getContactInfo();
      if (contactInfo?.storeUrl) {
        setShopUrl(contactInfo.storeUrl);
      }
    };
    fetchShopUrl();
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
                  <p>{t('validFrom') || 'Valid from'}: {new Date(coupon.validFrom).toLocaleDateString()}</p>
                  <p>{t('validUntil') || 'Valid until'}: {new Date(coupon.validTo).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center space-y-6 mb-8">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                {isMounted && voucherUrl ? (
                  <QRCode
                    value={voucherUrl}
                    size={256}
                    level="H"
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 text-center max-w-md">
                {t('qrCodeDescription') || 'Scan this QR code to view this voucher'}
              </p>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

