'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2, Share2, Trophy, Info, MapPin, Phone, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Promo, Business } from '@/types/promo';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { markPromoAsUsed, isPromoUsed } from '@/lib/firebase/user-promos';
import { motion } from 'framer-motion';
import { getYouTubeEmbedUrl } from '@/lib/utils/youtube';
import QRCodeCard from '@/components/cards/QRCodeCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


interface CouponViewPageClientProps {
  coupon: Promo;
  business: Business | null;
  businesses?: Business[];
}

export default function CouponViewPageClient({ coupon, business, businesses = [] }: CouponViewPageClientProps) {
  const t = useTranslations('pages.PromosPage');
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();
  const [isUsingCoupon, setIsUsingCoupon] = useState(false);
  const [isUsed, setIsUsed] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [couponUrl, setCouponUrl] = useState('');

  // Set mounted state and coupon URL only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/${locale}/promos/${coupon.id}${business ? `?businessId=${business.id}` : ''}`;
      setCouponUrl(url);
    }
  }, [locale, coupon.id, business]);

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


  const handleUseCouponClick = () => {
    if (!user) {
      toast.error('Please sign in to use coupons');
      router.push('/auth');
      return;
    }

    if (isUsed) {
      toast.error('This coupon has already been used');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleUseCoupon = async () => {
    setShowConfirmDialog(false);
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
    if (!isMounted || !couponUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: coupon.name,
          text: coupon.description || coupon.name,
          url: couponUrl,
        });
        toast.success(t('shared') || 'Shared successfully!');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          // Fallback to clipboard
          navigator.clipboard.writeText(couponUrl);
          toast.success(t('linkCopied') || 'Link copied to clipboard!');
        }
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(couponUrl);
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
            {/* Coupon Image or Video */}
            {coupon.youtubeUrl ? (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden bg-black">
                {getYouTubeEmbedUrl(coupon.youtubeUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(coupon.youtubeUrl) || ''}
                    title={coupon.name}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <span>Video unavailable</span>
                  </div>
                )}
              </div>
            ) : coupon.imageUrl && (
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
                    <p>{t('startDate') || 'Start'}: {new Date(coupon.startDate).toLocaleDateString('en-GB')}</p>
                  )}
                  {coupon.endDate && (
                    <p>{t('endDate') || 'End'}: {new Date(coupon.endDate).toLocaleDateString('en-GB')}</p>
                  )}
                </div>
              )}
            </div>

            {/* Businesses that accept this coupon */}
            {businesses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  {t('acceptedAt') || 'Accepted at'} ({businesses.length})
                </h2>
                <div className="space-y-4">
                  {businesses.map((biz) => (
                    <Card key={biz.id} className="border-l-4 border-l-primary">
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
              </div>
            )}

            {/* QR Code Card */}
            <div className="mb-8">
              <QRCodeCard url={couponUrl} />
            </div>

            {/* Important Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    {t('importantInfo') || 'Important Information'}
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>{t('couponUsageInfo') || 'This coupon can only be used at the shop that offers this promo'}</li>
                    <li>{t('oneTimeUse') || 'This coupon is valid for one-time use only'}</li>
                  </ul>
                </div>
              </div>
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
                  onClick={handleUseCouponClick}
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
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('confirmUse') || 'Confirm Use Coupon'}</DialogTitle>
                  <DialogDescription>
                    {t('confirmUseMessage') || `Are you sure you want to use "${coupon.name}"? This action cannot be undone.`}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={isUsingCoupon}
                  >
                    {t('cancel') || 'Cancel'}
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleUseCoupon}
                    disabled={isUsingCoupon}
                  >
                    {isUsingCoupon ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t('using') || 'Using...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t('confirm') || 'Confirm'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

