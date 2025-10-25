
import AdsPageWithTabs from '@/components/admin/AdsPageWithTabs';

export default async function AdsPage({
  searchParams
}: {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    tab?: string;
  };
}) {
  return <AdsPageWithTabs searchParams={searchParams} />;
}
