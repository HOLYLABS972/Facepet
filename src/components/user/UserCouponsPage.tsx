'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Coins, Ticket, Calendar, ShoppingCart, Copy, Check } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Coupon } from '@/types/coupon';
import { getCoupons } from '@/lib/actions/admin';
import { getUserFromFirestore } from '@/src/lib/firebase/users';
import toast from 'react-hot-toast';

export default function UserCouponsPage() {
  // const t = useTranslations('UserCoupons');
  console.log('UserCouponsPage loaded - translations disabled');
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userReferralCode, setUserReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available coupons
      const couponsResult = await getCoupons();
      if (couponsResult.success) {
        // Filter only active coupons that are currently valid
        const now = new Date();
        const validCoupons = couponsResult.coupons.filter(coupon => 
          coupon.isActive && 
          new Date(coupon.validFrom) <= now && 
          new Date(coupon.validTo) >= now
        );
        setCoupons(validCoupons);
      }

      // Fetch user data to get points and referral code
      if (user?.uid) {
        const userData = await getUserFromFirestore(user.uid);
        if (userData) {
          setUserPoints(userData.points || 0);
          setUserReferralCode(userData.referralCode || '');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
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

  const copyReferralLink = async () => {
    const referralLink = `${window.location.origin}/referral/${userReferralCode}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
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
        <h1 className="text-3xl font-bold mb-2">Coupons Store</h1>
        <p className="text-gray-600">Purchase coupons using your points and share your referral link to earn more points!</p>
      </div>

      {/* User Points and Referral Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Points Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              My Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {userPoints.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Earn points by registering and sharing your referral link</p>
          </CardContent>
        </Card>

        {/* Referral Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-500" />
              Referral Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Share your unique link to earn points when others register</p>
            <div className="flex gap-2">
              <Button 
                onClick={copyReferralLink}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="mb-8" />

      {/* Available Coupons */}
      <div className="mb-6">
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
      </div>
    </div>
  );
}
