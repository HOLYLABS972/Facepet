import ServicesPage from '@/src/components/pages/servicesPage';
import { getActiveAdsForServices } from '@/lib/actions/admin';
import Navbar from '@/src/components/layout/Navbar';

const page = async () => {
  const ads = await getActiveAdsForServices();

  return (
    <>
      <Navbar />
      <div className="flex grow flex-col h-[calc(100vh-64px)]">
        <ServicesPage ads={ads} />
      </div>
    </>
  );
};

export default page;
