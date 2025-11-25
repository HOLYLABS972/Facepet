import { getCouponsByBusiness, getCoupons } from '@/lib/firebase/queries/promo';
import { getBusinesses } from '@/lib/actions/admin';
import PromosPageClient from '@/components/pages/PromosPageClient';
import { getTranslations } from 'next-intl/server';

interface CouponsPageProps {
  searchParams: Promise<{
    businessId?: string;
  }>;
}

export default async function CouponsPage({ searchParams }: CouponsPageProps) {
  const params = await searchParams;
  const t = await getTranslations('pages.PromosPage');
  
  // Fetch businesses once for all cases
  const businessesResult = await getBusinesses();
  const businesses = businessesResult.success && businessesResult.businesses ? businessesResult.businesses : [];
  
  // If businessId is provided, show coupons for that business
  if (params.businessId) {
  if (!businessesResult.success || !businessesResult.businesses || !Array.isArray(businessesResult.businesses)) {
      // If businesses can't be fetched, show all coupons instead
      const allCoupons = await getCoupons();
      return (
        <PromosPageClient 
          promos={allCoupons} 
          business={null}
          businesses={businesses}
        />
      );
  }
  
  const business = businessesResult.businesses.find((b: any) => b.id === params.businessId);
  
  if (!business) {
      // If business not found, show all coupons instead
      const allCoupons = await getCoupons();
      return (
        <PromosPageClient 
          promos={allCoupons} 
          business={null}
          businesses={businesses}
        />
      );
  }

    // Get coupons for this business
    const coupons = await getCouponsByBusiness(params.businessId);

    return (
      <PromosPageClient 
        promos={coupons} 
        business={business}
        businesses={businesses}
      />
    );
  }

  // No businessId - show all coupons
  const allCoupons = await getCoupons();

  return (
    <PromosPageClient 
      promos={allCoupons} 
      business={null}
      businesses={businesses}
    />
  );
}

