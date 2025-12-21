import { getPromoById, getBusinesses } from '@/lib/actions/admin';
import { redirect } from 'next/navigation';
import CouponViewPageClient from '@/components/pages/CouponViewPageClient';
import { Business } from '@/types/promo';

interface CouponViewPageProps {
  params: Promise<{
    couponId: string;
    locale: string;
  }>;
  searchParams: Promise<{ businessId?: string }>;
}

export default async function CouponViewPage({ params, searchParams }: CouponViewPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { couponId } = resolvedParams;
  const businessId = resolvedSearchParams.businessId;

  if (!couponId) {
    redirect('/coupons');
  }

  // Fetch promo and businesses
  const [promoResult, businessesResult] = await Promise.all([
    getPromoById(couponId),
    getBusinesses(),
  ]);

  if (!promoResult.success || !promoResult.promo) {
    redirect('/coupons');
  }

  const businesses: Business[] = businessesResult.success ? businessesResult.businesses : [];

  // Find the business if businessId is provided
  let business: Business | null = null;
  if (businessId) {
    business = businesses.find(b => b.id === businessId) || null;
  }

  return (
    <CouponViewPageClient 
      coupon={promoResult.promo}
      business={business}
      businesses={businesses}
    />
  );
}

