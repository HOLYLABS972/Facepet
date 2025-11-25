import ServicesPage from '@/src/components/pages/servicesPage';
import { getActiveAdsForServices } from '@/lib/actions/admin';
import { getRandomActivePromo } from '@/lib/actions/admin';
import Navbar from '@/src/components/layout/Navbar';

const page = async () => {
  const ads = await getActiveAdsForServices();
  // Fetch random promo for all users (no audience filtering on services page)
  const promo = await getRandomActivePromo([]);
  
  return (
    <>
      <Navbar />
      <div className="flex grow flex-col p-4">
        <ServicesPage ads={ads} initialPromo={promo} />
      </div>
    </>
  );
};

export default page;
