import ServicesPage from '@/src/components/pages/servicesPage';
import { getActiveAdsForServices } from '@/lib/actions/admin';
import Navbar from '@/src/components/layout/Navbar';
import BottomNavigation from '@/src/components/layout/BottomNavigation';

interface ServicesPageProps {
  searchParams: Promise<{ businessId?: string }>;
}

const page = async ({ searchParams }: ServicesPageProps) => {
  const params = await searchParams;
  const ads = await getActiveAdsForServices();

  return (
    <>
      <Navbar />
      <div className="flex grow flex-col h-[calc(100vh-64px)] pb-16 md:pb-0">
        <ServicesPage ads={ads} businessId={params.businessId} />
      </div>
      <BottomNavigation />
    </>
  );
};

export default page;
