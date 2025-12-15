'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, Wallet, Calendar, ShoppingCart, History, Share2, Copy, Check, Tag, Eye, MapPin } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Coupon } from '@/types/coupon';
import { getCoupons, getContactInfo, getBusinesses, getCouponById } from '@/lib/actions/admin';
import { Business } from '@/types/promo';
import MapCard from '@/components/cards/MapCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [selectedCouponWithBusinesses, setSelectedCouponWithBusinesses] = useState<Coupon | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [couponForDialog, setCouponForDialog] = useState<Coupon | null>(null);
  const [userCouponForDialog, setUserCouponForDialog] = useState<UserCoupon | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const { redirectToShop } = useShopRedirect();
  
  // Fetch full coupon data when selected (to ensure we have businessIds)
  useEffect(() => {
    const fetchSelectedCouponData = async () => {
      if (selectedCoupon && (!selectedCoupon.businessIds && !selectedCoupon.businessId)) {
        console.log('🔄 Fetching full coupon data for:', selectedCoupon.id);
        const result = await getCouponById(selectedCoupon.id);
        if (result.success && result.coupon) {
          const fetchedCoupon = result.coupon as Coupon;
          console.log('✅ Fetched coupon with businessIds:', {
            hasBusinessId: !!fetchedCoupon.businessId,
            hasBusinessIds: !!fetchedCoupon.businessIds,
            businessId: fetchedCoupon.businessId,
            businessIds: fetchedCoupon.businessIds
          });
          // Merge the businessIds into the selected coupon
          setSelectedCouponWithBusinesses({
            ...selectedCoupon,
            businessId: fetchedCoupon.businessId,
            businessIds: fetchedCoupon.businessIds
          });
        } else {
          setSelectedCouponWithBusinesses(selectedCoupon);
        }
      } else {
        setSelectedCouponWithBusinesses(selectedCoupon);
      }
    };
    
    if (selectedCoupon) {
      fetchSelectedCouponData();
    } else {
      setSelectedCouponWithBusinesses(null);
    }
  }, [selectedCoupon]);

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
            id: coupon.id,
            isActive: coupon.isActive,
            validFrom: coupon.validFrom,
            validTo: coupon.validTo,
            points: coupon.points,
            price: coupon.price,
            hasBusinessId: !!coupon.businessId,
            hasBusinessIds: !!coupon.businessIds,
            businessId: coupon.businessId,
            businessIds: coupon.businessIds
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
        
        // Sort coupons: free vouchers (price === 0) first, then by price ascending
        const sortedCoupons = [...validCoupons].sort((a, b) => {
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

      // Fetch businesses for map
      const businessesResult = await getBusinesses();
      if (businessesResult.success && businessesResult.businesses) {
        // Store all businesses (don't filter by address here - MapCard will handle that)
        // This ensures we can match businesses by ID even if they don't have addresses yet
        const validBusinesses = businessesResult.businesses.filter((b: any) => 
          b.id && b.name
        ) as Business[];
        setBusinesses(validBusinesses);
        console.log('✅ Loaded businesses for map:', validBusinesses.length);
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
          
          // Filter out expired vouchers (past validTo date) unless they're already marked as used
          const now = new Date();
          const validCoupons = allCoupons.filter(uc => {
            // Keep used coupons in history
            if (uc.status === 'used') return true;
            // Keep coupons that are explicitly marked as expired
            if (uc.status === 'expired') return true;
            // Filter out coupons that are past their validTo date
            const validTo = new Date(uc.coupon.validTo);
            return validTo >= now;
          });
          
          // Sort: free vouchers first, then by purchasedAt descending (newest first)
          validCoupons.sort((a, b) => {
            const aIsFree = a.coupon.price === 0;
            const bIsFree = b.coupon.price === 0;
            
            // Free vouchers come first
            if (aIsFree && !bIsFree) return -1;
            if (!aIsFree && bIsFree) return 1;
            
            // If both are free or both are paid, sort by purchasedAt descending (newest first)
            return b.purchasedAt.getTime() - a.purchasedAt.getTime();
          });
          setCouponHistory(validCoupons);
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

      // Clear selected coupon and switch to "History" tab to show the purchased voucher
      setSelectedCoupon(null);
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
    return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-GB', {
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
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        setSelectedCoupon(null); // Clear selection when switching tabs
      }} className="w-full">
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
              <Wallet className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400" />
            </div>
            <p className="text-lg lg:text-xl text-gray-500 font-medium">{t('noCoupons')}</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 ${activeTab === 'available' && selectedCoupon ? 'xl:grid-cols-2 2xl:grid-cols-3' : 'xl:grid-cols-3 2xl:grid-cols-4'} gap-6 lg:gap-8 pb-24`}>
            {coupons.map((coupon) => (
              <Card 
                key={coupon.id} 
                onClick={() => setSelectedCoupon(coupon)}
                className={`relative group hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden bg-white cursor-pointer ${
                  selectedCoupon?.id === coupon.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/20'
                }`}
              >
                {coupon.imageUrl && (
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <img 
                      src={coupon.imageUrl} 
                      alt={coupon.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {/* Date Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-2">
                      <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                        <Calendar className="h-4 w-4" />
                        <span>{t('validUntil')}: {formatDate(coupon.validTo)}</span>
                      </div>
                    </div>
                  </div>
                )}
                <CardHeader className={coupon.imageUrl ? "pb-3" : ""}>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight flex-1">
                      {coupon.name}
                    </CardTitle>
                    {!coupon.imageUrl && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0">
                        <Wallet className="w-full h-full p-3 text-primary/40" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between p-3 rounded-lg ${coupon.price === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
                      <span className="text-sm font-medium text-gray-600">{t('pointsRequired')}</span>
                      {coupon.price === 0 ? (
                        <Badge className="bg-green-500 text-white hover:bg-green-600 px-3 py-1">
                          <span className="font-bold">{t('free')}</span>
                        </Badge>
                      ) : (
                      <Badge variant="outline" className={`flex items-center gap-1.5 bg-white px-3 py-1 ${freeCouponPrice ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}`}>
                        <Coins className="h-4 w-4" />
                        <span className="font-semibold">{freeCouponPrice ? '0' : coupon.points}</span>
                      </Badge>
                      )}
                    </div>
                    {freeCouponPrice && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">{t('price')}</span>
                        <Badge variant="outline" className="flex items-center gap-1.5 bg-white border-green-200 text-green-700 px-3 py-1">
                          <span className="font-semibold">{t('free')}</span>
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
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
                    className={`relative group hover:shadow-xl transition-all duration-300 border-2 overflow-hidden flex flex-col ${
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
                        {/* Date Overlay */}
                        {isActive && !isExpired && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-2">
                            <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                              <Calendar className="h-4 w-4" />
                              <span>{t('validUntil')}: {formatDate(coupon.validTo)}</span>
                            </div>
                          </div>
                        )}
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
                            <Wallet className={`w-full h-full p-3 ${
                              isActive && !isExpired ? 'text-green-600' : 'text-gray-400'
                            }`} />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className={`text-sm font-medium ${
                            isActive && !isExpired ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {t('price')}
                          </span>
                          <span className={`text-lg font-bold ${
                            isActive && !isExpired 
                              ? (coupon.price === 0 ? 'text-green-600' : 'text-primary')
                              : 'text-gray-600 line-through'
                          }`}>
                            {coupon.price === 0 ? t('free') : formatPrice(coupon.price)}
                          </span>
                        </div>
                        {userCoupon.usedAt && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-500">{t('usedOn') || 'Used on'}</span>
                            <span className="text-sm text-gray-600">{formatDate(userCoupon.usedAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 flex flex-col gap-2 mt-auto">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.push(`/${locale}/vouchers/${userCoupon.id}`)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Eye className="h-5 w-5" />
                        {t('view') || 'View'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          console.log('🗺️ Opening map for user coupon:', userCoupon.id, userCoupon.coupon?.name);
                          setUserCouponForDialog(userCoupon);
                          setCouponForDialog(null); // Clear coupon if set
                          setSelectedBusiness(null); // Clear selected business
                          setShowMapDialog(true);
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {t('showMap')}
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

      {/* Sidebar for Selected Coupon - Desktop Only */}
      {activeTab === 'available' && selectedCoupon && (
        <>
          {/* Backdrop Overlay */}
          <div 
            className="hidden lg:block fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setSelectedCoupon(null)}
          />
          {/* Sidebar */}
          <div className="hidden lg:block fixed top-0 right-0 h-full w-96 max-w-[90vw] z-50 shadow-2xl animate-slide-in-right">
            <Card className="h-full border-l-2 border-r-0 border-t-0 border-b-0 shadow-2xl bg-white rounded-none flex flex-col overflow-y-auto">
              <CardHeader className="pb-4 border-b sticky top-0 bg-white z-10">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-xl font-bold text-gray-900 leading-tight flex-1">
                    {selectedCoupon.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCoupon(null)}
                    className="h-8 w-8 flex-shrink-0 hover:bg-gray-100 rounded-full"
                  >
                    <span className="sr-only">Close</span>
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 flex-1">
                {selectedCoupon.imageUrl && (
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                    <img 
                      src={selectedCoupon.imageUrl} 
                      alt={selectedCoupon.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-lg ${selectedCoupon.price === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <span className="text-sm font-medium text-gray-600">{t('pointsRequired')}</span>
                    {selectedCoupon.price === 0 ? (
                      <Badge className="bg-green-500 text-white hover:bg-green-600 px-3 py-1">
                        <span className="font-bold">{t('free')}</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={`flex items-center gap-1.5 bg-white px-3 py-1 ${freeCouponPrice ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}`}>
                        <Coins className="h-4 w-4" />
                        <span className="font-semibold">{freeCouponPrice ? '0' : selectedCoupon.points}</span>
                      </Badge>
                    )}
                  </div>
                  {freeCouponPrice && (
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">{t('price')}</span>
                      <Badge variant="outline" className="flex items-center gap-1.5 bg-white border-green-200 text-green-700 px-3 py-1">
                        <span className="font-semibold">{t('free')}</span>
                      </Badge>
                    </div>
                  )}
                  {selectedCoupon.description && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{selectedCoupon.description}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {t('validUntil')}: {formatDate(selectedCoupon.validTo)}
                    </span>
                  </div>
                  
                  {/* Businesses that accept this coupon */}
                  {(() => {
                    // Use the coupon with businesses data if available, otherwise fall back to selectedCoupon
                    const couponToUse = selectedCouponWithBusinesses || selectedCoupon;
                    
                    // Get business IDs from coupon - support both old and new format
                    let couponBusinessIds = couponToUse.businessIds || (couponToUse.businessId ? [couponToUse.businessId] : []);
                    
                    // Debug: Log the coupon structure
                    console.log('🔍 Sidebar - Selected Coupon Debug:', {
                      couponId: couponToUse.id,
                      couponName: couponToUse.name,
                      hasBusinessId: !!couponToUse.businessId,
                      hasBusinessIds: !!couponToUse.businessIds,
                      businessId: couponToUse.businessId,
                      businessIds: couponToUse.businessIds,
                      usingFetchedData: !!selectedCouponWithBusinesses
                    });
                    
                    // Filter businesses that match the coupon's business IDs
                    const couponBusinesses = businesses.filter(b => {
                      const matches = couponBusinessIds.includes(b.id);
                      if (!matches && couponBusinessIds.length > 0) {
                        console.log(`⚠️ Business ${b.id} (${b.name}) not in coupon businessIds:`, couponBusinessIds);
                      }
                      return matches;
                    });
                    
                    // Filter businesses to only include those with addresses for the map
                    const couponBusinessesWithAddress = couponBusinesses.filter(b => b.contactInfo?.address);
                    
                    console.log('🔍 Sidebar - Businesses Debug:', {
                      couponId: couponToUse.id,
                      couponName: couponToUse.name,
                      couponBusinessIds,
                      totalBusinesses: businesses.length,
                      allBusinessIds: businesses.map(b => b.id),
                      filteredBusinesses: couponBusinesses.length,
                      businessesWithAddress: couponBusinessesWithAddress.length,
                      businesses: couponBusinesses.map(b => ({ id: b.id, name: b.name, hasAddress: !!b.contactInfo?.address }))
                    });
                    
                    if (couponBusinesses.length > 0) {
                      return (
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700">
                            {t('acceptedAt')} ({couponBusinesses.length})
                          </h3>
                          <div className="space-y-2">
                            {couponBusinesses.map((biz) => (
                              <Card 
                                key={biz.id}
                                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
                                onClick={() => {
                                  setSelectedBusiness(biz);
                                  setCouponForDialog(couponToUse);
                                  setShowMapDialog(true);
                                }}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-3">
                                    {biz.imageUrl && (
                                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                          src={biz.imageUrl}
                                          alt={biz.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm mb-1">{biz.name}</h4>
                                      {biz.contactInfo?.address && (
                                        <div className="flex items-start gap-1.5 text-xs text-gray-600">
                                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                          <span className="line-clamp-1">{biz.contactInfo.address}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={async () => {
                              // Ensure we have the latest coupon data with businessIds
                              let couponToSet = couponToUse;
                              if (!couponToUse.businessIds && !couponToUse.businessId) {
                                console.log('🔄 Fetching coupon data before opening map dialog...');
                                const result = await getCouponById(couponToUse.id);
                                if (result.success && result.coupon) {
                                  const fetchedCoupon = result.coupon as Coupon;
                                  couponToSet = {
                                    ...couponToUse,
                                    businessId: fetchedCoupon.businessId,
                                    businessIds: fetchedCoupon.businessIds
                                  };
                                }
                              }
                              setCouponForDialog(couponToSet);
                              setSelectedBusiness(null);
                              setUserCouponForDialog(null); // Clear user coupon if set
                              setShowMapDialog(true);
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            {t('showMap')}
                          </Button>
                          
                          {/* Map directly in sidebar - only show if there are businesses with addresses */}
                          {couponBusinessesWithAddress.length > 0 ? (
                            <div className="mt-4">
                              <MapCard 
                                key={`sidebar-map-${selectedCoupon.id}-${couponBusinessesWithAddress.length}`}
                                businesses={couponBusinessesWithAddress}
                                title={t('businessLocations') || 'Business Locations'}
                              />
                            </div>
                          ) : (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                              <p className="text-sm text-gray-500">
                                {t('noBusinessesFound') || 'No businesses with addresses found for this coupon'}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </CardContent>
              <CardFooter className="pt-6 border-t sticky bottom-0 bg-white">
                <Button 
                  onClick={() => {
                    handlePurchaseCoupon(selectedCoupon);
                    setSelectedCoupon(null);
                  }}
                  disabled={!freeCouponPrice && userPoints < selectedCoupon.points}
                  className="w-full flex items-center justify-center gap-2 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {freeCouponPrice 
                    ? t('getFree')
                    : (userPoints < selectedCoupon.points ? t('insufficientPoints') : t('purchase'))
                  }
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}

      {/* Fixed Bottom Bar for Selected Coupon - Mobile Only */}
      {activeTab === 'available' && selectedCoupon && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-[90] p-4 md:bottom-0">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{selectedCoupon.name}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <Badge variant="outline" className={`flex items-center gap-1.5 bg-white px-3 py-1 ${freeCouponPrice ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}`}>
                    <Coins className="h-4 w-4" />
                    <span className="font-semibold">{freeCouponPrice ? '0' : selectedCoupon.points} {t('pointsRequired')}</span>
                  </Badge>
                  {freeCouponPrice && (
                    <Badge variant="outline" className="flex items-center gap-1.5 bg-white border-green-200 text-green-700 px-3 py-1">
                      <span className="font-semibold">{t('free')}</span>
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => {
                  if (selectedCoupon) {
                  handlePurchaseCoupon(selectedCoupon);
                  setSelectedCoupon(null);
                  }
                }}
                disabled={!freeCouponPrice && selectedCoupon && userPoints < selectedCoupon.points}
                className="flex items-center justify-center gap-2 h-12 px-6 text-base font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5" />
                {freeCouponPrice 
                  ? t('getFree')
                  : (selectedCoupon && userPoints < selectedCoupon.points ? t('insufficientPoints') : t('purchase'))
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Map Dialog */}
      <Dialog open={showMapDialog} onOpenChange={(open) => {
        setShowMapDialog(open);
        if (!open) {
          setSelectedBusiness(null);
          // Don't clear couponForDialog/userCouponForDialog here - they might be needed for re-opening
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(() => {
                if (selectedBusiness) {
                  return `${t('mapFor')} ${selectedBusiness.name}`;
                }
                const couponName = userCouponForDialog?.coupon.name || couponForDialog?.name;
                return couponName ? `${t('mapFor')} ${couponName}` : t('showMap');
              })()}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            // Debug: Log what we have
            console.log('🔍 Map Dialog - State Debug:', {
              hasUserCouponForDialog: !!userCouponForDialog,
              hasCouponForDialog: !!couponForDialog,
              hasSelectedBusiness: !!selectedBusiness,
              userCouponCoupon: userCouponForDialog?.coupon,
              couponForDialog: couponForDialog,
              totalBusinesses: businesses.length
            });
            
            const coupon = userCouponForDialog?.coupon || couponForDialog;
            
            if (!coupon) {
              console.warn('⚠️ No coupon found in dialog state');
              return (
                <div className="p-4 text-center text-gray-500">
                  <p className="mb-2">{t('noBusinessesFound') || 'No coupon selected'}</p>
                  <p className="text-sm text-gray-400">
                    Please try clicking the map button again.
                  </p>
                </div>
              );
            }
            
            // If a specific business is selected, show only that business
            if (selectedBusiness) {
              console.log('📍 Showing map for selected business:', selectedBusiness.name);
              return <MapCard businesses={[selectedBusiness]} />;
            }
            
            // Otherwise, show all businesses associated with this coupon
            let couponBusinessIds = coupon.businessIds || (coupon.businessId ? [coupon.businessId] : []);
            
            // If no businessIds found, try to fetch the coupon again
            if (couponBusinessIds.length === 0) {
              console.log('⚠️ No businessIds in dialog coupon, fetching fresh data...');
              // Note: We can't use async/await here in the render, so we'll show a loading state
              // and the useEffect should handle fetching
            }
            
            const couponBusinesses = businesses.filter(b => couponBusinessIds.includes(b.id));
            // Filter businesses to only include those with addresses for the map
            const couponBusinessesWithAddress = couponBusinesses.filter(b => b.contactInfo?.address);
            
            console.log('🔍 Map Dialog - Coupon Debug:', {
              couponId: coupon.id,
              couponName: coupon.name,
              couponBusinessIds,
              totalBusinesses: businesses.length,
              allBusinessIds: businesses.map(b => b.id),
              filteredBusinesses: couponBusinesses.length,
              businessesWithAddress: couponBusinessesWithAddress.length,
              businesses: couponBusinesses.map(b => ({ id: b.id, name: b.name, hasAddress: !!b.contactInfo?.address }))
            });
            
            // Show businesses even if they don't have addresses - just show them in the list
            // Only filter by address for the map display
            if (couponBusinesses.length === 0) {
              // If we have businessIds but no matching businesses, there's a data mismatch
              if (couponBusinessIds.length > 0) {
                return (
                  <div className="p-4 text-center">
                    <p className="text-gray-500 mb-4">
                      {t('noBusinessesFound') || 'No businesses found for this coupon'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Business IDs: {couponBusinessIds.join(', ')}. Found {businesses.length} total businesses in database.
                      <br />
                      The business IDs might not match any existing businesses.
                    </p>
                  </div>
                );
              }
              
              // No businessIds at all
              return (
                <div className="p-4 text-center">
                  <p className="text-gray-500 mb-4">
                    {t('noBusinessesFound') || 'No businesses found for this coupon'}
                  </p>
                  <p className="text-sm text-gray-400">
                    This coupon has no businesses assigned.
                  </p>
                </div>
              );
            }
            
            // Show the map - if no businesses with addresses, show empty map but don't show error
            // The businesses list above already shows all businesses
            return <MapCard businesses={couponBusinessesWithAddress.length > 0 ? couponBusinessesWithAddress : couponBusinesses} />;
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
