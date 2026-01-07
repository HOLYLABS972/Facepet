import { redirect } from 'next/navigation';

interface PromoViewPageProps {
  params: {
    promoId: string;
    locale: string;
  };
  searchParams: { businessId?: string };
}

export default async function PromoViewPage({ params, searchParams }: PromoViewPageProps) {
  const { promoId } = params;
  const businessId = searchParams.businessId;

  // Redirect to vouchers page
  if (businessId) {
    redirect(`/vouchers/${promoId}?businessId=${businessId}`);
  } else {
    redirect(`/vouchers/${promoId}`);
  }
}

