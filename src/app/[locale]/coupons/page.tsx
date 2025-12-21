import PromosPageClient from '@/components/pages/PromosPageClient';
import { getPromos, getBusinesses } from '@/lib/actions/admin';
import { Promo, Business } from '@/types/promo';

interface CouponsPageProps {
  searchParams: Promise<{ businessId?: string }>;
}

const page = async ({ searchParams }: CouponsPageProps) => {
  const params = await searchParams;
  const businessId = params.businessId;

  // Fetch all promos and businesses
  const [promosResult, businessesResult] = await Promise.all([
    getPromos(),
    getBusinesses(),
  ]);

  // Handle errors
  if (!promosResult.success) {
    console.error('Failed to fetch promos:', promosResult.error);
  }
  if (!businessesResult.success) {
    console.error('Failed to fetch businesses:', businessesResult.error);
  }

  // Get promos and businesses, defaulting to empty arrays on error
  let promos: Promo[] = promosResult.success ? promosResult.promos : [];
  const businesses: Business[] = businessesResult.success ? businessesResult.businesses : [];
  
  // Debug: Log all promos before filtering
  console.log('All promos fetched:', promos.length);
  console.log('Promos data:', promos.map(p => ({ id: p.id, name: p.name, isActive: p.isActive, startDate: p.startDate, endDate: p.endDate, imageUrl: p.imageUrl })));

  // Filter promos by businessId if provided
  let business: Business | null = null;
  if (businessId) {
    // Find the business
    business = businesses.find(b => b.id === businessId) || null;
    
    // Filter promos for this business
    promos = promos.filter(promo => {
      // Check new businessIds array format
      if (promo.businessIds && Array.isArray(promo.businessIds)) {
        return promo.businessIds.includes(businessId);
      }
      // Check legacy businessId format
      return promo.businessId === businessId;
    });
  }

  // Filter for active promos only (be lenient - only exclude if explicitly set to false)
  promos = promos.filter(promo => {
    // Only exclude if explicitly set to false (default to true if undefined)
    return promo.isActive !== false;
  });
  
  // Debug logging
  console.log(`Promos after filtering (isActive check only): ${promos.length}`);

  return (
    <PromosPageClient 
      promos={promos} 
      business={business}
      businesses={businesses}
    />
  );
};

export default page;

