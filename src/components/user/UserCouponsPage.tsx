'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Coins, Wallet, Calendar, ShoppingCart, History, Share2, Copy, Check, Tag, Eye, MapPin, QrCode, X } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Coupon } from '@/types/coupon';
import { getCoupons, getContactInfo, getBusinesses, getCouponById } from '@/lib/actions/admin';
import { Business } from '@/types/promo';
import MapCard from '@/components/cards/MapCard';
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
  const [activeTab, setActiveTab] = useState('shop');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [shopUrl, setShopUrl] = useState<string>('');
  const [freeCouponPrice, setFreeCouponPrice] = useState<boolean>(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedCouponImage, setSelectedCouponImage] = useState<{ imageUrl: string; name: string; description?: string; coupon?: Coupon; userCoupon?: UserCoupon } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const { redirectToShop, getShopUrl } = useShopRedirect();

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

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
        
        // Convert ISO strings back to Date objects and normalize businessIds
        const couponsWithDates = couponsResult.coupons.map((coupon: any) => {
          // Parse and normalize businessIds
          let normalizedBusinessIds: string[] | undefined = undefined;
          if (coupon.businessIds) {
            if (Array.isArray(coupon.businessIds)) {
              normalizedBusinessIds = coupon.businessIds.filter((id: any) => id != null && id !== '');
            } else if (typeof coupon.businessIds === 'string') {
              normalizedBusinessIds = [coupon.businessIds];
            }
          } else if (coupon.businessId) {
            // Legacy format: convert single businessId to array
            normalizedBusinessIds = [coupon.businessId];
          }
          
          // Debug: Log specific coupon
          if (coupon.id === 'IvmgfeBPfGRXLIQ5ce0Q') {
            console.log('🔍🔍🔍 CLIENT - Parsing coupon IvmgfeBPfGRXLIQ5ce0Q:', {
              rawBusinessIds: coupon.businessIds,
              rawBusinessId: coupon.businessId,
              normalizedBusinessIds,
              normalizedLength: normalizedBusinessIds?.length,
              isArray: Array.isArray(coupon.businessIds),
              type: typeof coupon.businessIds,
              couponKeys: Object.keys(coupon)
            });
          }
          
          const parsedCoupon = {
            ...coupon,
            createdAt: new Date(coupon.createdAt),
            updatedAt: new Date(coupon.updatedAt),
            validFrom: new Date(coupon.validFrom),
            validTo: new Date(coupon.validTo),
            businessIds: normalizedBusinessIds && normalizedBusinessIds.length > 0 ? normalizedBusinessIds : undefined,
            // Keep businessId for backward compatibility
            businessId: coupon.businessId
          };
          
          // Debug: Log specific coupon after parsing
          if (coupon.id === 'IvmgfeBPfGRXLIQ5ce0Q') {
            console.log('🔍 Client - After parsing coupon IvmgfeBPfGRXLIQ5ce0Q:', {
              parsedBusinessIds: parsedCoupon.businessIds,
              parsedBusinessIdsLength: parsedCoupon.businessIds?.length,
              parsedBusinessIdsIsArray: Array.isArray(parsedCoupon.businessIds)
            });
          }
          
          return parsedCoupon;
        }) as Coupon[];
        
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
        
        // Debug: Log final coupons before setting state
        const targetCoupon = sortedCoupons.find(c => c.id === 'IvmgfeBPfGRXLIQ5ce0Q');
        if (targetCoupon) {
          console.log('🔍🔍🔍 CLIENT - Final coupon before setState IvmgfeBPfGRXLIQ5ce0Q:', {
            id: targetCoupon.id,
            name: targetCoupon.name,
            businessIds: targetCoupon.businessIds,
            businessIdsLength: targetCoupon.businessIds?.length,
            businessIdsIsArray: Array.isArray(targetCoupon.businessIds),
            hasBusinessId: !!targetCoupon.businessId,
            hasBusinessIds: !!targetCoupon.businessIds,
            allKeys: Object.keys(targetCoupon)
          });
        } else {
          console.warn('⚠️⚠️⚠️ CLIENT - Target coupon IvmgfeBPfGRXLIQ5ce0Q NOT FOUND in sortedCoupons!');
        }
        
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

    if (!shopUrl) {
      toast.error('Shop URL is not configured');
      return;
    }

    // Generate shop URL with userid, coupon, and callback
    // Using a default coupon code 'sale990' as shown in the example
    // You may want to make this configurable or use a different default
    const generatedShopUrl = getShopUrl(shopUrl, 'sale990');
    
    if (!generatedShopUrl) {
      toast.error('Failed to generate shop URL');
      return;
    }

    const shareData = {
      title: t('shareShopTitle') || 'Check out our shop!',
      text: t('shareShopText') || 'Check out our shop with this special link!',
      url: generatedShopUrl
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success(t('sharedSuccessfully') || 'Shared successfully!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(generatedShopUrl);
        toast.success(t('linkCopied') || 'Link copied to clipboard!');
      }
      // Note: Points will be awarded when someone actually uses the callback URL,
      // not when the link is shared. This is handled by the shop callback API endpoint.
    } catch (err) {
      console.error('Failed to share:', err);
      // Only show error if it's not a user cancellation
      if ((err as any).name !== 'AbortError') {
        toast.error(t('failedToShare') || 'Failed to share');
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

      // Switch to "My Coupons" tab to show the purchased voucher
      setActiveTab('myCoupons');
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
      // Switch to my coupons tab
      setActiveTab('myCoupons');
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-24 md:pb-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8 lg:mb-12 text-right">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
          <h1 className="text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl ml-auto">{t('description')}</p>
            </div>
            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
              className="flex items-center gap-2 flex-shrink-0"
            >
              <Share2 className="h-5 w-5" />
              {t('share') || 'Share'}
            </Button>
          </div>
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
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
      }} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 lg:mb-10 h-12 lg:h-14 bg-gray-100/50 p-1 rounded-xl">
          <TabsTrigger 
            value="shop" 
            className="flex items-center gap-2 text-sm lg:text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-md transition-all rounded-lg"
          >
            <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5" />
            {t('shop') || 'Shop'}
          </TabsTrigger>
          <TabsTrigger 
            value="myCoupons" 
            className="flex items-center gap-2 text-sm lg:text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-md transition-all rounded-lg"
          >
            <Wallet className="h-4 w-4 lg:h-5 lg:w-5" />
            {t('myCoupons') || 'My Coupons'}
          </TabsTrigger>
        </TabsList>

        {/* Shop Tab */}
        <TabsContent value="shop" className="space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 lg:mb-8 text-gray-900">{t('availableCoupons')}</h2>
        {coupons.length === 0 ? (
          <div className="text-center py-16 lg:py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="inline-flex p-4 rounded-full bg-gray-100 mb-4">
              <Wallet className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400" />
            </div>
            <p className="text-lg lg:text-xl text-gray-500 font-medium">{t('noCoupons')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 pb-24">
            {coupons.map((coupon) => (
              <Card 
                key={coupon.id} 
                className="relative group hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden bg-white hover:border-primary/20 flex flex-col"
              >
                {coupon.imageUrl && (
                  <div 
                    className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedCouponImage({ imageUrl: coupon.imageUrl, name: coupon.name, description: coupon.description, coupon });
                    }}
                  >
                    <img 
                      src={coupon.imageUrl} 
                      alt={coupon.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedCouponImage({ imageUrl: coupon.imageUrl, name: coupon.name, description: coupon.description, coupon });
                      }}
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
                  {!coupon.imageUrl && (
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <CardTitle className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight flex-1">
                        {coupon.name}
                      </CardTitle>
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0">
                        <Wallet className="w-full h-full p-3 text-primary/40" />
                      </div>
                    </div>
                  )}
                  {/* One-row summary info */}
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-semibold text-gray-900 truncate">{coupon.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {coupon.price !== 0 && (
                        <Badge variant="outline" className={`flex items-center gap-1 px-2 py-0.5 text-xs ${freeCouponPrice ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}`}>
                          <Coins className="h-3 w-3" />
                          <span>{freeCouponPrice ? '0' : coupon.points}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  {coupon.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{coupon.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
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
                <CardFooter className="pt-4 mt-auto flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
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
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 flex items-center justify-center gap-2"
                    onClick={async () => {
                      // Get business IDs from coupon - fetch if needed
                      let couponToUse = coupon;
                      
                      // If no businessIds found, fetch the coupon to get them
                      const hasBusinessIds = couponToUse?.businessIds && Array.isArray(couponToUse.businessIds) && couponToUse.businessIds.length > 0;
                      const hasBusinessId = !!couponToUse?.businessId;
                      
                      if (!hasBusinessIds && !hasBusinessId && couponToUse?.id) {
                        // Fetch the coupon to get businessIds
                        const result = await getCouponById(couponToUse.id);
                        if (result.success && result.coupon) {
                          couponToUse = result.coupon as Coupon;
                        }
                      }
                      
                      // Parse and normalize businessIds to ensure it's always an array
                      let businessIds: string[] = [];
                      if (couponToUse?.businessIds) {
                        if (Array.isArray(couponToUse.businessIds)) {
                          businessIds = couponToUse.businessIds.filter(id => id != null && id !== '');
                        } else if (typeof couponToUse.businessIds === 'string') {
                          businessIds = [couponToUse.businessIds];
                        }
                      } else if (couponToUse?.businessId) {
                        businessIds = [couponToUse.businessId];
                      }
                      
                      if (businessIds.length > 0) {
                        const idsString = businessIds.join(',');
                        router.push(`/${locale}/services?businessId=${idsString}`);
                      } else {
                        router.push(`/${locale}/services`);
                      }
                    }}
                  >
                    <MapPin className="h-5 w-5" />
                    {t('showMap')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        {/* My Coupons Tab */}
        <TabsContent value="myCoupons" className="space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 lg:mb-8 text-gray-900">{t('myCoupons')}</h2>
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
                    <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                      <Badge 
                        variant={isActive && !isExpired ? 'default' : isExpired ? 'destructive' : 'secondary'} 
                        className={`shadow-md ${isActive && !isExpired ? 'bg-green-500' : ''}`}
                      >
                        {isActive && !isExpired ? t('active') : isExpired ? t('expired') : t('used')}
                      </Badge>
                    </div>
                    {coupon.imageUrl && (
                      <div 
                        className={`relative h-48 overflow-hidden bg-gradient-to-br cursor-pointer ${
                          isActive && !isExpired ? 'from-green-100 to-green-200' : 'from-gray-100 to-gray-200'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedCouponImage({ imageUrl: coupon.imageUrl, name: coupon.name, description: coupon.description, userCoupon });
                        }}
                      >
                        <img 
                          src={coupon.imageUrl} 
                          alt={coupon.name}
                          className={`w-full h-full object-cover transition-transform duration-300 ${
                            isActive && !isExpired ? 'group-hover:scale-110' : 'grayscale'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedCouponImage({ imageUrl: coupon.imageUrl, name: coupon.name, description: coupon.description, userCoupon });
                          }}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${
                          isActive && !isExpired ? 'from-black/20' : 'from-black/30'
                        } to-transparent`} />
                        {/* Date Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-2">
                          <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                            <Calendar className="h-4 w-4" />
                            <span>{t('validUntil')}: {formatDate(coupon.validTo)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <CardHeader className={coupon.imageUrl ? "pb-3" : "pt-6"}>
                      {!coupon.imageUrl && (
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <CardTitle className={`text-xl lg:text-2xl font-bold leading-tight flex-1 ${
                            isActive && !isExpired ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {coupon.name}
                          </CardTitle>
                          <div className={`w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br flex-shrink-0 ${
                            isActive && !isExpired 
                              ? 'from-green-100 to-green-200' 
                              : 'from-gray-100 to-gray-200 grayscale'
                          }`}>
                            <Wallet className={`w-full h-full p-3 ${
                              isActive && !isExpired ? 'text-green-600' : 'text-gray-400'
                            }`} />
                          </div>
                        </div>
                      )}
                      {/* One-row summary info */}
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`font-semibold truncate ${
                            isActive && !isExpired ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {coupon.name}
                          </span>
                        </div>
                      </div>
                      {coupon.description && (
                        <p className={`text-sm mt-2 line-clamp-2 ${
                          isActive && !isExpired ? 'text-gray-600' : 'text-gray-500'
                        }`}>
                          {coupon.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-4 flex-1">
                        {coupon.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{coupon.description}</p>
                        )}
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
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 flex flex-col gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.push(`/${locale}/vouchers/${userCoupon.id}`)}
                        className="w-full h-12 flex items-center justify-center gap-2"
                      >
                        <QrCode className="h-5 w-5" />
                        {t('showQR') || 'Show QR'}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-12 flex items-center justify-center gap-2"
                        onClick={async () => {
                          // Get business IDs from coupon - fetch if needed
                          let couponToUse = coupon;
                          
                          // If no businessIds found, fetch the coupon to get them
                          const hasBusinessIds = couponToUse?.businessIds && Array.isArray(couponToUse.businessIds) && couponToUse.businessIds.length > 0;
                          const hasBusinessId = !!couponToUse?.businessId;
                          
                          if (!hasBusinessIds && !hasBusinessId && couponToUse?.id) {
                            // Fetch the coupon to get businessIds
                            const result = await getCouponById(couponToUse.id);
                            if (result.success && result.coupon) {
                              couponToUse = result.coupon as Coupon;
                            }
                          }
                          
                          // Parse and normalize businessIds to ensure it's always an array
                          let businessIds: string[] = [];
                          if (couponToUse?.businessIds) {
                            if (Array.isArray(couponToUse.businessIds)) {
                              businessIds = couponToUse.businessIds.filter(id => id != null && id !== '');
                            } else if (typeof couponToUse.businessIds === 'string') {
                              businessIds = [couponToUse.businessIds];
                            }
                          } else if (couponToUse?.businessId) {
                            businessIds = [couponToUse.businessId];
                          }
                          
                          if (businessIds.length > 0) {
                            const idsString = businessIds.join(',');
                            router.push(`/${locale}/services?businessId=${idsString}`);
                          } else {
                            router.push(`/${locale}/services`);
                          }
                        }}
                      >
                        <MapPin className="h-5 w-5" />
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

      {/* Responsive Modal: Dialog on Desktop, Drawer on Mobile */}
      {isDesktop ? (
        <Dialog open={!!selectedCouponImage} onOpenChange={(open) => !open && setSelectedCouponImage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedCouponImage && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">{selectedCouponImage.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Image */}
                  {selectedCouponImage.imageUrl && (
                    <div className="rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={selectedCouponImage.imageUrl} 
                        alt={selectedCouponImage.name}
                        className="w-full h-auto object-contain max-h-[400px] mx-auto"
                      />
                    </div>
                  )}
                  
                  {/* Description */}
                  {selectedCouponImage.description && (
                    <div>
                      <p className="text-base text-gray-700">{selectedCouponImage.description}</p>
                    </div>
                  )}
                  
                  {/* Date */}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {t('validUntil')}: {
                        selectedCouponImage.coupon 
                          ? formatDate(selectedCouponImage.coupon.validTo)
                          : selectedCouponImage.userCoupon?.coupon
                          ? formatDate(selectedCouponImage.userCoupon.coupon.validTo)
                          : ''
                      }
                    </span>
                  </div>
                  
                  {/* Points/Price Info */}
                  {selectedCouponImage.coupon && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{t('pointsRequired')}</span>
                        {selectedCouponImage.coupon.price === 0 ? (
                          <Badge className="bg-green-500 text-white">
                            {t('free')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={`flex items-center gap-1.5 ${freeCouponPrice ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}`}>
                            <Coins className="h-4 w-4" />
                            <span>{freeCouponPrice ? '0' : selectedCouponImage.coupon.points}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    {selectedCouponImage.coupon && (
                      <Button
                        onClick={() => {
                          if (selectedCouponImage.coupon) {
                            handlePurchaseCoupon(selectedCouponImage.coupon);
                            setSelectedCouponImage(null);
                          }
                        }}
                        disabled={!freeCouponPrice && selectedCouponImage.coupon && userPoints < selectedCouponImage.coupon.points}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-12"
                        size="lg"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        <span className="font-semibold">
                          {freeCouponPrice 
                            ? t('getFree') 
                            : (selectedCouponImage.coupon && userPoints < selectedCouponImage.coupon.points 
                              ? t('insufficientPoints') 
                              : t('purchase'))
                          }
                        </span>
                      </Button>
                    )}
                    {selectedCouponImage.userCoupon && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          router.push(`/${locale}/vouchers/${selectedCouponImage.userCoupon!.id}`);
                          setSelectedCouponImage(null);
                        }}
                        className="flex-1 border-2 flex items-center justify-center gap-2 h-12"
                        size="lg"
                      >
                        <QrCode className="h-5 w-5" />
                        <span className="font-semibold">{t('showQR') || 'Show QR'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={!!selectedCouponImage} onOpenChange={(open) => !open && setSelectedCouponImage(null)}>
          <DrawerContent className="max-h-[85vh]">
            {selectedCouponImage && (
              <>
                <DrawerHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <DrawerTitle className="text-2xl font-bold">{selectedCouponImage.name}</DrawerTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCouponImage(null)}
                      className="h-8 w-8"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </DrawerHeader>
                <div className="px-4 pb-6 overflow-y-auto">
                  {/* Image */}
                  {selectedCouponImage.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={selectedCouponImage.imageUrl} 
                        alt={selectedCouponImage.name}
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}
                  
                  {/* Description */}
                  {selectedCouponImage.description && (
                    <div className="mb-4">
                      <p className="text-base text-gray-700">{selectedCouponImage.description}</p>
                    </div>
                  )}
                  
                  {/* Date */}
                  <div className="mb-4 flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {t('validUntil')}: {
                        selectedCouponImage.coupon 
                          ? formatDate(selectedCouponImage.coupon.validTo)
                          : selectedCouponImage.userCoupon?.coupon
                          ? formatDate(selectedCouponImage.userCoupon.coupon.validTo)
                          : ''
                      }
                    </span>
                  </div>
                  
                  {/* Points/Price Info */}
                  {selectedCouponImage.coupon && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{t('pointsRequired')}</span>
                        {selectedCouponImage.coupon.price === 0 ? (
                          <Badge className="bg-green-500 text-white">
                            {t('free')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={`flex items-center gap-1.5 ${freeCouponPrice ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}`}>
                            <Coins className="h-4 w-4" />
                            <span>{freeCouponPrice ? '0' : selectedCouponImage.coupon.points}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 mt-6">
                    {selectedCouponImage.coupon && (
                      <Button
                        onClick={() => {
                          if (selectedCouponImage.coupon) {
                            handlePurchaseCoupon(selectedCouponImage.coupon);
                            setSelectedCouponImage(null);
                          }
                        }}
                        disabled={!freeCouponPrice && selectedCouponImage.coupon && userPoints < selectedCouponImage.coupon.points}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-12"
                        size="lg"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        <span className="font-semibold">
                          {freeCouponPrice 
                            ? t('getFree') 
                            : (selectedCouponImage.coupon && userPoints < selectedCouponImage.coupon.points 
                              ? t('insufficientPoints') 
                              : t('purchase'))
                          }
                        </span>
                      </Button>
                    )}
                    {selectedCouponImage.userCoupon && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          router.push(`/${locale}/vouchers/${selectedCouponImage.userCoupon!.id}`);
                          setSelectedCouponImage(null);
                        }}
                        className="w-full border-2 flex items-center justify-center gap-2 h-12"
                        size="lg"
                      >
                        <QrCode className="h-5 w-5" />
                        <span className="font-semibold">{t('showQR') || 'Show QR'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
