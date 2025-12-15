import { getCouponById } from '@/lib/firebase/queries/promo';
import { getBusinesses } from '@/lib/actions/admin';
import { redirect } from 'next/navigation';
import CouponViewPageClient from '@/components/pages/CouponViewPageClient';
import { getTranslations } from 'next-intl/server';
import { Business } from '@/types/promo';

interface CouponViewPageProps {
  params: Promise<{
    promoId: string;
    locale: string;
  }>;
  searchParams: Promise<{
    businessId?: string;
  }>;
}

export default async function CouponViewPage({ params, searchParams }: CouponViewPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations('pages.PromosPage');
  
  const { promoId } = resolvedParams;
  
  if (!promoId) {
    redirect('/promos');
  }

  // Get coupon
  const coupon = await getCouponById(promoId);
  
  if (!coupon) {
    redirect('/promos');
  }

  // Get business if businessId is provided (for single business display)
  let business = null;
  if (resolvedSearchParams.businessId || coupon.businessId) {
    const businessesResult = await getBusinesses();
    if (businessesResult.success && businessesResult.businesses) {
      const businessId = resolvedSearchParams.businessId || coupon.businessId;
      business = businessesResult.businesses.find((b: any) => b.id === businessId);
    }
  }

  // Get all businesses associated with this coupon (for map display)
  let allBusinesses: Business[] = [];
  const businessesResult = await getBusinesses();
  if (businessesResult.success && businessesResult.businesses) {
    const businessIds = coupon.businessIds || (coupon.businessId ? [coupon.businessId] : []);
    allBusinesses = businessesResult.businesses.filter((b: any) => businessIds.includes(b.id));
  }

  return (
    <CouponViewPageClient 
      coupon={coupon} 
      business={business}
      businesses={allBusinesses}
    />
  );
}

