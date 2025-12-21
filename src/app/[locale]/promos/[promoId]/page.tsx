import { redirect } from 'next/navigation';

interface PromoViewPageProps {
  params: Promise<{
    promoId: string;
    locale: string;
  }>;
  searchParams: Promise<{ businessId?: string }>;
}

export default async function PromoViewPage({ params, searchParams }: PromoViewPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { promoId } = resolvedParams;
  const businessId = resolvedSearchParams.businessId;

  // Redirect to vouchers page
  if (businessId) {
    redirect(`/vouchers/${promoId}?businessId=${businessId}`);
  } else {
    redirect(`/vouchers/${promoId}`);
  }
}

