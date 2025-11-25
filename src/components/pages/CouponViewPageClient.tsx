'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Tag, CheckCircle2, Share2, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Promo, Business } from '@/types/promo';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { QRCode } from 'react-qr-code';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { markPromoAsUsed, isPromoUsed } from '@/lib/firebase/user-promos';
import { motion } from 'framer-motion';

interface CouponViewPageClientProps {
  coupon: Promo;
  business: Business | null;
}

export default function CouponViewPageClient({ coupon, business }: CouponViewPageClientProps) {
  const t = useTranslations('pages.PromosPage');
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();
  const [isUsingCoupon, setIsUsingCoupon] = useState(false);
  const [isUsed, setIsUsed] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Check if coupon is already used
  useEffect(() => {
    const checkUsed = async () => {
      if (user) {
        const used = await isPromoUsed(user.uid, coupon.id);
        setIsUsed(used);
      }
    };
    checkUsed();
  }, [user, coupon.id]);

  const handleUseCoupon = async () => {
    if (!user) {
      toast.error('Please sign in to use coupons');
      router.push('/auth');
      return;
    }

    if (isUsed) {
      toast.error('This coupon has already been used');
      return;
    }

    setIsUsingCoupon(true);
    
    try {
      const result = await markPromoAsUsed(user.uid, coupon.id);
      
      if (result.success) {
        setIsUsed(true);
        setShowSuccessAnimation(true);
        toast.success(t('promoUsed') || 'Coupon marked as used!');
        
        // Hide animation and redirect after 2 seconds
        setTimeout(() => {
          setShowSuccessAnimation(false);
          // Redirect back to coupons list
          router.push(`/${locale}/promos${business ? `?businessId=${business.id}` : ''}`);
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to mark coupon as used');
      }
    } catch (error) {
      console.error('Error using coupon:', error);
      toast.error('Failed to use coupon');
    } finally {
      setIsUsingCoupon(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/${locale}/promos/${coupon.id}${business ? `?businessId=${business.id}` : ''}`
      : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: coupon.name,
          text: coupon.description || coupon.name,
          url: url,
        });
        toast.success(t('shared') || 'Shared successfully!');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          // Fallback to clipboard
          navigator.clipboard.writeText(url);
          toast.success(t('linkCopied') || 'Link copied to clipboard!');
        }
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      toast.success(t('linkCopied') || 'Link copied to clipboard!');
    }
  };

  const getCouponUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/${locale}/promos/${coupon.id}${business ? `?businessId=${business.id}` : ''}`;
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
            {/* Coupon Image */}
            {coupon.imageUrl && (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                <img
                  src={coupon.imageUrl}
                  alt={coupon.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Coupon Info */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">{coupon.name}</h1>
              {coupon.description && (
                <p className="text-gray-600 mb-4">{coupon.description}</p>
              )}
              {business && (
                <p className="text-sm text-gray-500 mb-4">{business.name}</p>
              )}
              {(coupon.startDate || coupon.endDate) && (
                <div className="text-sm text-gray-500 mb-4">
                  {coupon.startDate && (
                    <p>{t('startDate') || 'Start'}: {new Date(coupon.startDate).toLocaleDateString()}</p>
                  )}
                  {coupon.endDate && (
                    <p>{t('endDate') || 'End'}: {new Date(coupon.endDate).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center space-y-6 mb-8">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                <QRCode
                  value={getCouponUrl()}
                  size={256}
                  level="H"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>
              <p className="text-sm text-gray-600 text-center max-w-md">
                {t('qrCodeDescription') || 'Scan this QR code to view this coupon'}
              </p>
            </div>

            {/* Success Animation - Prize Icon */}
            {showSuccessAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: [0, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="bg-white rounded-lg p-8 text-center max-w-sm mx-4 shadow-2xl"
                >
                  <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
                  <p className="text-2xl font-bold text-gray-900 mb-2">{t('gotPrize') || 'I got a prize!'}</p>
                  <p className="text-gray-600">{t('couponUsedSuccess') || 'Coupon used successfully!'}</p>
                </motion.div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant={isUsed ? "secondary" : "default"}
                  size="lg"
                  onClick={handleUseCoupon}
                  disabled={isUsed || isUsingCoupon}
                  className="flex-1"
                >
                  {isUsingCoupon ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t('using') || 'Using...'}
                    </>
                  ) : isUsed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('used') || 'Used'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('use') || 'Use'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {t('share') || 'Share'}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.push(`/${locale}/promos${business ? `?businessId=${business.id}` : ''}`)}
                className="w-full"
              >
                <Tag className="w-4 h-4 mr-2" />
                {t('showAllCoupons') || 'Show All Coupons'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

