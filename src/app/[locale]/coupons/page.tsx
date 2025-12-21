import PromosPageClient from '@/components/pages/PromosPageClient';
import { getPromos, getBusinesses } from '@/lib/actions/admin';
import Navbar from '@/components/layout/Navbar';
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

  // Filter for active promos only
  const now = new Date();
  promos = promos.filter(promo => {
    // Only exclude if explicitly set to false
    if (promo.isActive === false) {
      return false;
    }
    
    // Check date range if both dates are provided
    if (promo.startDate && promo.endDate) {
      if (now < promo.startDate || now > promo.endDate) {
        return false;
      }
    } else if (promo.startDate && !promo.endDate) {
      // If only start date, check if it has started
      if (now < promo.startDate) {
        return false;
      }
    } else if (!promo.startDate && promo.endDate) {
      // If only end date, check if it hasn't ended
      if (now > promo.endDate) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <>
      <Navbar />
      <div className="flex grow flex-col">
        <PromosPageClient 
          promos={promos} 
          business={business}
          businesses={businesses}
        />
      </div>
    </>
  );
};

export default page;

