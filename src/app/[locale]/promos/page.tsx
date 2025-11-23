import { getPromosByBusiness } from '@/lib/firebase/queries/promo';
import { getBusinesses } from '@/lib/actions/admin';
import { redirect } from 'next/navigation';
import PromosPageClient from '@/components/pages/PromosPageClient';
import { getTranslations } from 'next-intl/server';

interface PromosPageProps {
  searchParams: Promise<{
    businessId?: string;
  }>;
}

export default async function PromosPage({ searchParams }: PromosPageProps) {
  const params = await searchParams;
  const t = await getTranslations('pages.PromosPage');
  
  if (!params.businessId) {
    redirect('/services');
  }

  // Get business info
  const businessesResult = await getBusinesses();
  
  if (!businessesResult.success || !businessesResult.businesses || !Array.isArray(businessesResult.businesses)) {
    redirect('/services');
  }
  
  const business = businessesResult.businesses.find((b: any) => b.id === params.businessId);
  
  if (!business) {
    redirect('/services');
  }

  // Get promos for this business
  const promos = await getPromosByBusiness(params.businessId);

  return (
    <PromosPageClient 
      promos={promos} 
      business={business}
    />
  );
}

