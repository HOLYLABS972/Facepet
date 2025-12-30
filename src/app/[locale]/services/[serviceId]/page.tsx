import { getBusinessById, getAdById } from '@/lib/actions/admin';
import ServiceDetailsPageClient from '@/components/pages/ServiceDetailsPageClient';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface ServiceDetailsPageProps {
  params: Promise<{
    serviceId: string;
    locale: string;
  }>;
}

export default async function ServiceDetailsPage({ params }: ServiceDetailsPageProps) {
  const resolvedParams = await params;
  const { serviceId, locale } = resolvedParams;

  // Try to fetch as business first (since services page uses businesses)
  let service = null;
  if (serviceId) {
    const business = await getBusinessById(serviceId);
    if (business) {
      // Convert business to service format
      service = {
        id: business.id,
        title: business.name,
        description: business.description,
        content: business.description,
        phone: business.contactInfo?.phone || '',
        location: business.contactInfo?.address || '',
        tags: business.tags || [],
        imageUrl: business.imageUrl || ''
      };
    } else {
      // Fallback: try to fetch as advertisement
      const ad = await getAdById(serviceId);
      if (ad) {
        service = {
          id: ad.id,
          title: ad.title,
          description: ad.description,
          content: ad.content,
          phone: ad.phone || '',
          location: ad.location || '',
          tags: ad.tags || [],
          imageUrl: ad.content || ''
        };
      }
    }
  }

  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-[calc(100vh-64px)]">
        <ServiceDetailsPageClient service={service} />
        <Footer />
      </div>
    </>
  );
}

