import ServicesPage from '@/src/components/pages/servicesPage';
import { getActiveAdsForServices } from '@/lib/actions/admin';
import Navbar from '@/src/components/layout/Navbar';

const page = async () => {
  const ads = await getActiveAdsForServices();
  return (
    <>
      <Navbar />
      <div className="flex grow flex-col p-4">
        <ServicesPage ads={ads} />
      </div>
    </>
  );
};

export default page;
