'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ShoppingCart, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { UserCoupon } from '@/src/lib/supabase/database/coupons';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { useShopRedirect } from '@/hooks/use-shop-redirect';
import QRCodeCard from '@/components/cards/QRCodeCard';


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

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
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
            </div>

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
      </div>
    </div>
  );
}

