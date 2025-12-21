import { redirect } from 'next/navigation';

interface PromosPageProps {
  searchParams: Promise<{ businessId?: string }>;
}

const page = async ({ searchParams }: PromosPageProps) => {
  const params = await searchParams;
  const businessId = params.businessId;
  
  // Redirect to vouchers page
  if (businessId) {
    redirect(`/vouchers?businessId=${businessId}`);
  } else {
    redirect('/vouchers');
  }
};

export default page;

