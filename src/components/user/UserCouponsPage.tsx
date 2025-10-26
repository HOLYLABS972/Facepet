'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, Ticket, Calendar, ShoppingCart, Store, History, Share2 } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Coupon } from '@/types/coupon';
import { getCoupons } from '@/lib/actions/admin';
import { getUserFromFirestore } from '@/src/lib/firebase/users';
import { addPointsToCategory } from '@/src/lib/firebase/points';
import { User } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function UserCouponsPage() {
  // const t = useTranslations('UserCoupons');
  console.log('UserCouponsPage loaded - translations disabled');
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [userCoupons, setUserCoupons] = useState<Coupon[]>([]); // Active purchased coupons
  const [couponHistory, setCouponHistory] = useState<Coupon[]>([]); // Used/Expired coupons
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shop');

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
        
        // Log all coupons for debugging
        couponsResult.coupons.forEach(coupon => {
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
        
        const validCoupons = couponsResult.coupons.filter(coupon => {
          const validFrom = new Date(coupon.validFrom);
          const validTo = new Date(coupon.validTo);
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
        setCoupons(couponsResult.coupons);
      } else {
        console.error('❌ No coupons or failed to fetch:', couponsResult.error);
        setCoupons([]);
      }

      // Fetch user data to get points
      if (user?.uid) {
        console.log('Fetching user data for UID:', user.uid);
        const userData = await getUserFromFirestore(user.uid);
        console.log('User data:', userData);
        if (userData) {
          setUserPoints(userData.points || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!user) {
      toast.error('Please sign in to share');
      return;
    }

    const shareUrl = window.location.origin;
    const shareText = `Check out FacePet! Join me and get amazing deals on pet services: ${shareUrl}`;
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
        toast.success('Shared successfully! You earned 20 points!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        shared = true;
        toast.success('Link copied to clipboard! You earned 20 points!');
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
          const userData = await getUserFromFirestore(user.uid);
          if (userData) {
            setUserPoints((userData.user?.points || 0) + 20);
          }
        } else {
          console.error('Failed to award points:', result.error);
        }
      }
    } catch (err) {
      console.error('Failed to share:', err);
      // Only show error if it's not a user cancellation
      if ((err as any).name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  const handlePurchaseCoupon = async (coupon: Coupon) => {
    if (!user) {
      toast.error('Please sign in to purchase coupons');
      return;
    }

    if (userPoints < coupon.points) {
      toast.error('Insufficient points to purchase this coupon');
      return;
    }

    try {
      // TODO: Implement coupon purchase logic
      // This would involve:
      // 1. Deducting points from user
      // 2. Adding coupon to user's purchased coupons
      // 3. Updating user's points in database
      
      toast.success(`Successfully purchased ${coupon.name}!`);
      // Refresh user points
      if (user?.uid) {
        const userData = await getUserFromFirestore(user.uid);
        if (userData) {
          setUserPoints(userData.points || 0);
        }
      }
    } catch (error) {
      console.error('Error purchasing coupon:', error);
      toast.error('Failed to purchase coupon');
    }
  };


  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading coupons...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Coupons</h1>
        <p className="text-gray-600">Browse and purchase coupons using your points!</p>
      </div>

      {/* User Points Section */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              My Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {userPoints.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Use your points to purchase coupons!</p>
                </div>
              </div>
              
              {/* Call to Action */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Share & Earn Points</p>
                    <p className="text-xs text-gray-500">Share the app and get 20 points!</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +20 points
                  </Badge>
                </div>
                <Button
                  onClick={handleShare}
                  variant="default"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 bg-primary"
                >
                  <Share2 className="h-4 w-4" />
                  Share the App
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="shop" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Shop
          </TabsTrigger>
          <TabsTrigger value="my-coupons" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            My Coupons
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Shop Tab */}
        <TabsContent value="shop" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Available Coupons</h2>
        {coupons.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No coupons available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{coupon.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {coupon.description}
                      </CardDescription>
                    </div>
                    {coupon.imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img 
                          src={coupon.imageUrl} 
                          alt={coupon.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Price</span>
                      <span className="font-semibold">{formatPrice(coupon.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Points Required</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {coupon.points}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Valid Until</span>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(coupon.validTo)}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handlePurchaseCoupon(coupon)}
                    disabled={userPoints < coupon.points}
                    className="w-full flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {userPoints < coupon.points ? 'Insufficient Points' : 'Purchase'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        </TabsContent>

        {/* My Coupons Tab */}
        <TabsContent value="my-coupons" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">My Purchased Coupons</h2>
          {userCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">You haven't purchased any coupons yet</p>
              <p className="text-sm text-gray-400 mt-2">Visit the Shop tab to browse available coupons!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCoupons.map((coupon) => (
                <Card key={coupon.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{coupon.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {coupon.description}
                        </CardDescription>
                      </div>
                      {coupon.imageUrl && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          <img 
                            src={coupon.imageUrl} 
                            alt={coupon.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Price</span>
                        <span className="font-semibold">{formatPrice(coupon.price)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Points Used</span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {coupon.points}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Valid Until</span>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(coupon.validTo)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      disabled
                    >
                      <Ticket className="h-4 w-4" />
                      Purchased
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Coupon History</h2>
          {couponHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No coupon history yet</p>
              <p className="text-sm text-gray-400 mt-2">Used and expired coupons will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {couponHistory.map((coupon) => {
                const isExpired = new Date(coupon.validTo) < new Date();
                return (
                  <Card key={coupon.id} className="relative opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{coupon.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {coupon.description}
                          </CardDescription>
                        </div>
                        {coupon.imageUrl && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img 
                              src={coupon.imageUrl} 
                              alt={coupon.name}
                              className="w-full h-full object-cover grayscale"
                            />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Price</span>
                          <span className="font-semibold">{formatPrice(coupon.price)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Points Used</span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            {coupon.points}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status</span>
                          <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                            {isExpired ? 'Expired' : 'Used'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline"
                        className="w-full flex items-center gap-2"
                        disabled
                      >
                        <History className="h-4 w-4" />
                        {isExpired ? 'Expired' : 'Used'}
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
  );
}
