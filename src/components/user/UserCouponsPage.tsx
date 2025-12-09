'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, Ticket, Calendar, ShoppingCart, History, Share2, Copy, Check, Tag, Eye } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Coupon } from '@/types/coupon';
import { getCoupons, getContactInfo } from '@/lib/actions/admin';
import { getUserFromFirestore } from '@/src/lib/firebase/users';
import { addPointsToCategory, getUserPoints, deductPointsFromCategory } from '@/src/lib/firebase/points';
import { purchaseCoupon, getActiveUserCoupons, getCouponHistory, markCouponAsUsed, UserCoupon } from '@/src/lib/firebase/user-coupons';
import { useShopRedirect } from '@/hooks/use-shop-redirect';
import { User } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function UserCouponsPage() {
  const t = useTranslations('components.UserCoupons');
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponHistory, setCouponHistory] = useState<UserCoupon[]>([]); // All purchased coupons (active + inactive)
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [shopUrl, setShopUrl] = useState<string>('');
  const [freeCouponPrice, setFreeCouponPrice] = useState<boolean>(false);
  const { redirectToShop } = useShopRedirect();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('=== Fetching coupons ===');
      // Fetch available coupons
      const couponsResult = await getCoupons();
      console.log('Coupons result:', JSON.stringify(couponsResult, null, 2));
      
      if (couponsResult.success && couponsResult.coupons) {
        console.log(`✅ Found ${couponsResult.coupons.length} total coupons`);
        
        // Convert ISO strings back to Date objects
        const couponsWithDates = couponsResult.coupons.map((coupon: any) => ({
          ...coupon,
          createdAt: new Date(coupon.createdAt),
          updatedAt: new Date(coupon.updatedAt),
          validFrom: new Date(coupon.validFrom),
          validTo: new Date(coupon.validTo),
        })) as Coupon[];
        
        // Log all coupons for debugging
        couponsWithDates.forEach(coupon => {
          console.log(`Coupon: ${coupon.name}`, {
            isActive: coupon.isActive,
            validFrom: coupon.validFrom,
            validTo: coupon.validTo,
            points: coupon.points,
            price: coupon.price
          });
        });
        
        // Filter only active coupons that are currently valid
        const now = new Date();
        console.log(`Current date: ${now.toISOString()}`);
        
        const validCoupons = couponsWithDates.filter(coupon => {
          const validFrom = coupon.validFrom;
          const validTo = coupon.validTo;
          const isValid = coupon.isActive && validFrom <= now && validTo >= now;
          
          console.log(`Checking coupon "${coupon.name}":`, {
            isActive: coupon.isActive,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
            isValid
          });
          
          return isValid;
        });
        
        console.log(`✅ Found ${validCoupons.length} valid coupons after filtering`);
        console.log('Valid coupons:', validCoupons);
        
        // TEMPORARY: Show ALL coupons for debugging, not just valid ones
        console.log('🔍 TEMPORARY DEBUG MODE: Showing all coupons regardless of validity');
        
        // Sort coupons: free vouchers (price === 0) first, then by price ascending
        const sortedCoupons = [...couponsWithDates].sort((a, b) => {
          const aIsFree = a.price === 0;
          const bIsFree = b.price === 0;
          
          // Free vouchers come first
          if (aIsFree && !bIsFree) return -1;
          if (!aIsFree && bIsFree) return 1;
          
          // If both are free or both are paid, sort by price ascending
          return a.price - b.price;
        });
        
        setCoupons(sortedCoupons);
      } else {
        console.error('❌ No coupons or failed to fetch:', couponsResult.error);
        setCoupons([]);
      }

      // Fetch shop URL from contact info
      const contactInfo = await getContactInfo();
      if (contactInfo?.storeUrl) {
        setShopUrl(contactInfo.storeUrl);
      }

      // Fetch user points from userPoints collection
      if (user) {
        console.log('Fetching user points for UID:', user.uid);
        const pointsResult = await getUserPoints(user);
        console.log('Points result:', pointsResult);
        if (pointsResult.success && pointsResult.points) {
          setUserPoints(pointsResult.points.totalPoints || 0);
        } else {
          // Default to 0 if points not found
          setUserPoints(0);
        }

        // Fetch user settings to check freeCouponPrice
        const userResult = await getUserFromFirestore(user.uid);
        if (userResult.success && userResult.user) {
          setFreeCouponPrice(userResult.user.freeCouponPrice || false);
        }

        // Fetch all purchased coupons for history (active + inactive)
        const historyResult = await getCouponHistory(user.uid);
        if (historyResult.success && historyResult.coupons) {
          // Convert ISO strings back to Date objects
          const allCoupons = historyResult.coupons.map(uc => ({
            ...uc,
            coupon: {
              ...uc.coupon,
              validFrom: new Date(uc.coupon.validFrom as any),
              validTo: new Date(uc.coupon.validTo as any),
            },
            purchasedAt: new Date(uc.purchasedAt as any),
            usedAt: uc.usedAt ? new Date(uc.usedAt as any) : undefined
          }));
          // Sort: free vouchers first, then by purchasedAt descending (newest first)
          allCoupons.sort((a, b) => {
            const aIsFree = a.coupon.price === 0;
            const bIsFree = b.coupon.price === 0;
            
            // Free vouchers come first
            if (aIsFree && !bIsFree) return -1;
            if (!aIsFree && bIsFree) return 1;
            
            // If both are free or both are paid, sort by purchasedAt descending (newest first)
            return b.purchasedAt.getTime() - a.purchasedAt.getTime();
          });
          setCouponHistory(allCoupons);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!user) {
      toast.error(t('pleaseSignInShare'));
      return;
    }

    const shareUrl = window.location.origin;
    const shareText = t('shareText', { url: shareUrl });
    const shareData = {
      title: 'FacePet',
      text: shareText,
      url: shareUrl
    };

    try {
      let shared = false;
      
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        shared = true;
        toast.success(t('sharedSuccessfully'));
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        shared = true;
        toast.success(t('linkCopied'));
      }

      // Award 20 points for sharing
      if (shared) {
        console.log('Awarding 20 points for sharing...');
        const result = await addPointsToCategory(
          user as User,
          'share',
          20,
          'Shared the app from coupons page'
        );
        
        if (result.success) {
          console.log('✅ Points awarded successfully');
          // Refresh user points
          const pointsResult = await getUserPoints(user);
          if (pointsResult.success && pointsResult.points) {
            setUserPoints(pointsResult.points.totalPoints || 0);
          }
        } else {
          console.error('Failed to award points:', result.error);
        }
      }
    } catch (err) {
      console.error('Failed to share:', err);
      // Only show error if it's not a user cancellation
      if ((err as any).name !== 'AbortError') {
        toast.error(t('failedToShare'));
      }
    }
  };

  const handlePurchaseCoupon = async (coupon: Coupon) => {
    if (!user) {
      toast.error(t('pleaseSignIn'));
      return;
    }

    // Calculate actual points needed (0 if freeCouponPrice is enabled)
    const pointsNeeded = freeCouponPrice ? 0 : coupon.points;

    if (!freeCouponPrice && userPoints < coupon.points) {
      toast.error(t('insufficientPoints'));
      return;
    }

    try {
      // Only deduct points if freeCouponPrice is disabled
      if (!freeCouponPrice) {
        const deductResult = await deductPointsFromCategory(
          user as User,
          'share',
          coupon.points,
          `Purchased coupon: ${coupon.name}`
        );

        if (!deductResult.success) {
          toast.error(deductResult.error || t('failedToPurchase'));
          return;
        }
      }

      // Purchase the coupon (with 0 points if free)
      const purchaseResult = await purchaseCoupon(user.uid, coupon, pointsNeeded);
      
      if (!purchaseResult.success) {
        // Refund points if purchase failed and points were deducted
        if (!freeCouponPrice) {
          await addPointsToCategory(user as User, 'share', coupon.points, 'Refund for failed purchase');
        }
        toast.error(purchaseResult.error || t('failedToPurchase'));
        return;
      }

      toast.success(t('purchaseSuccess', { name: coupon.name }));
      
      // Refresh all data
      await fetchData();

      // Switch to "History" tab to show the purchased voucher
      setActiveTab('history');
    } catch (error) {
      console.error('Error purchasing coupon:', error);
      toast.error(t('failedToPurchase'));
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(t('codeCopied'));
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast.error(t('failedToCopy'));
    }
  };

  const handleUseCoupon = async (userCoupon: UserCoupon) => {
    // Mark as used and move to history
    const result = await markCouponAsUsed(userCoupon.id);
    if (result.success) {
      toast.success(t('couponMarkedAsUsed') || 'Coupon marked as used!');
      // Refresh history
      if (user) {
        const historyResult = await getCouponHistory(user.uid);
        if (historyResult.success && historyResult.coupons) {
          const allCoupons = historyResult.coupons.map(uc => ({
            ...uc,
            coupon: {
              ...uc.coupon,
              validFrom: new Date(uc.coupon.validFrom as any),
              validTo: new Date(uc.coupon.validTo as any),
            },
            purchasedAt: new Date(uc.purchasedAt as any),
            usedAt: uc.usedAt ? new Date(uc.usedAt as any) : undefined
          }));
          allCoupons.sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
          setCouponHistory(allCoupons);
        }
      }
      // Switch to history tab
      setActiveTab('history');
    } else {
      toast.error(t('failedToMarkAsUsed') || 'Failed to mark coupon as used');
    }
  };



  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8 lg:mb-12 text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">{t('description')}</p>
        </div>

        {/* User Points Section */}
        <div className="mb-8 lg:mb-10">
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl lg:text-2xl">
                <div className="p-2 rounded-full bg-yellow-100">
                  <Coins className="h-6 w-6 text-yellow-600" />
                </div>
                {t('myPoints')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent mb-3">
                      {userPoints.toLocaleString()}
                    </div>
                    <p className="text-base text-gray-600">{t('pointsDescription')}</p>
                  </div>
                </div>
                
                {/* Call to Action */}
                <div className="border-t pt-6 bg-gradient-to-r from-green-50/50 to-transparent rounded-lg p-4 -mx-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900 mb-1">{t('shareAndEarn')}</p>
                      <p className="text-sm text-gray-600">{t('shareDescription')}</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm px-3 py-1.5">
                      +20 {t('points')}
                    </Badge>
                  </div>
                  <Button
                    onClick={handleShare}
                    variant="default"
                    size="lg"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                  >
                    <Share2 className="h-5 w-5" />
                    {t('shareButton')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 lg:mb-10 h-12 lg:h-14 bg-gray-100/50 p-1 rounded-xl">
          <TabsTrigger 
            value="available" 
            className="flex items-center gap-2 text-sm lg:text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-md transition-all rounded-lg"
          >
            <Tag className="h-4 w-4 lg:h-5 lg:w-5" />
            {t('available') || 'Available'}
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex items-center gap-2 text-sm lg:text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-md transition-all rounded-lg"
          >
            <History className="h-4 w-4 lg:h-5 lg:w-5" />
            {t('history')}
          </TabsTrigger>
        </TabsList>

        {/* Available Tab */}
        <TabsContent value="available" className="space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 lg:mb-8 text-gray-900">{t('availableCoupons')}</h2>
        {coupons.length === 0 ? (
          <div className="text-center py-16 lg:py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="inline-flex p-4 rounded-full bg-gray-100 mb-4">
              <Ticket className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400" />
            </div>
            <p className="text-lg lg:text-xl text-gray-500 font-medium">{t('noCoupons')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
            {coupons.map((coupon) => (
              <Card 
                key={coupon.id} 
                className="relative group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden bg-white"
              >
                {coupon.imageUrl && (
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <img 
                      src={coupon.imageUrl} 
                      alt={coupon.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
                <CardHeader className={coupon.imageUrl ? "pb-3" : ""}>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight flex-1">
                      {coupon.name}
                    </CardTitle>
                    {!coupon.imageUrl && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0">
                        <Ticket className="w-full h-full p-3 text-primary/40" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">{t('pointsRequired')}</span>
                      <Badge variant="outline" className={`flex items-center gap-1.5 bg-white px-3 py-1 ${freeCouponPrice ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}`}>
                        <Coins className="h-4 w-4" />
                        <span className="font-semibold">{freeCouponPrice ? '0' : coupon.points}</span>
                      </Badge>
                    </div>
                    {freeCouponPrice && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">{t('price')}</span>
                        <Badge variant="outline" className="flex items-center gap-1.5 bg-white border-green-200 text-green-700 px-3 py-1">
                          <span className="font-semibold">{t('free')}</span>
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">{t('validUntil')}</span>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-blue-700">
                        <Calendar className="h-4 w-4" />
                        {formatDate(coupon.validTo)}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4">
                  <Button 
                    onClick={() => handlePurchaseCoupon(coupon)}
                    disabled={!freeCouponPrice && userPoints < coupon.points}
                    className="w-full flex items-center justify-center gap-2 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {freeCouponPrice 
                      ? t('getFree')
                      : (userPoints < coupon.points ? t('insufficientPoints') : t('purchase'))
                    }
                  </Button>
                </CardFooter>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 lg:mb-8 text-gray-900">{t('couponHistory')}</h2>
          {couponHistory.length === 0 ? (
            <div className="text-center py-16 lg:py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="inline-flex p-4 rounded-full bg-gray-100 mb-4">
                <History className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400" />
              </div>
              <p className="text-lg lg:text-xl text-gray-500 font-medium mb-2">{t('noHistory')}</p>
              <p className="text-sm lg:text-base text-gray-400">{t('historyDescription')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
              {couponHistory.map((userCoupon) => {
                const coupon = userCoupon.coupon;
                // Ensure status is properly set (default to 'active' if missing or invalid)
                const status = userCoupon.status || 'active';
                // Only mark as expired if status is explicitly 'expired', not based on date
                // Vouchers stay active until explicitly used or expired
                const isActive = status === 'active';
                const isExpired = status === 'expired';
                const isUsed = status === 'used';
                const couponCode = coupon.description;
                const isCodeCopied = copiedCode === couponCode;
                
                return (
                  <Card 
                    key={userCoupon.id} 
                    className={`relative group hover:shadow-xl transition-all duration-300 border-2 overflow-hidden ${
                      isActive && !isExpired 
                        ? 'border-green-200 hover:border-green-300 bg-gradient-to-br from-white to-green-50/30 opacity-100' 
                        : 'opacity-75 hover:opacity-90 border-gray-200 bg-gradient-to-br from-gray-50 to-white'
                    }`}
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <Badge 
                        variant={isActive && !isExpired ? 'default' : isExpired ? 'destructive' : 'secondary'} 
                        className={`shadow-md ${isActive && !isExpired ? 'bg-green-500' : ''}`}
                      >
                        {isActive && !isExpired ? t('active') : isExpired ? t('expired') : t('used')}
                      </Badge>
                    </div>
                    {coupon.imageUrl && (
                      <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${
                        isActive && !isExpired ? 'from-green-100 to-green-200' : 'from-gray-100 to-gray-200'
                      }`}>
                        <img 
                          src={coupon.imageUrl} 
                          alt={coupon.name}
                          className={`w-full h-full object-cover transition-transform duration-300 ${
                            isActive && !isExpired ? 'group-hover:scale-110' : 'grayscale'
                          }`}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${
                          isActive && !isExpired ? 'from-black/20' : 'from-black/30'
                        } to-transparent`} />
                      </div>
                    )}
                    <CardHeader className={coupon.imageUrl ? "pb-3" : "pt-6"}>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className={`text-xl lg:text-2xl font-bold leading-tight flex-1 ${
                          isActive && !isExpired ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {coupon.name}
                        </CardTitle>
                        {!coupon.imageUrl && (
                          <div className={`w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br flex-shrink-0 ${
                            isActive && !isExpired 
                              ? 'from-green-100 to-green-200' 
                              : 'from-gray-100 to-gray-200 grayscale'
                          }`}>
                            <Ticket className={`w-full h-full p-3 ${
                              isActive && !isExpired ? 'text-green-600' : 'text-gray-400'
                            }`} />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className={`text-sm font-medium ${
                            isActive && !isExpired ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {t('price')}
                          </span>
                          <span className={`text-lg font-bold ${
                            isActive && !isExpired 
                              ? 'text-primary' 
                              : 'text-gray-600 line-through'
                          }`}>
                            {formatPrice(coupon.price)}
                          </span>
                        </div>
                        {isActive && !isExpired && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">{t('validUntil')}</span>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-blue-700">
                              <Calendar className="h-4 w-4" />
                              {formatDate(coupon.validTo)}
                            </div>
                          </div>
                        )}
                        {userCoupon.usedAt && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-500">{t('usedOn') || 'Used on'}</span>
                            <span className="text-sm text-gray-600">{formatDate(userCoupon.usedAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.push(`/${locale}/vouchers/${userCoupon.id}`)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Eye className="h-5 w-5" />
                        {t('view') || 'View'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
