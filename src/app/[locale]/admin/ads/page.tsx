
import AdActions from '@/components/admin/AdActions';
import AddAdForm from '@/components/admin/AddAdForm';
import AdImageThumbnail from '@/components/admin/AdImageThumbnail';
import { DataTablePagination } from '@/components/admin/DataTablePagination';
import { LimitSelector } from '@/components/admin/LimitSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { redirect } from '@/i18n/routing';
import { getAllAds } from '@/lib/actions/admin';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function AdsPage({
  searchParams
}: {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
}) {
  const t = await getTranslations('Admin');
  const locale = await getLocale();

  // Note: Authentication is handled client-side in AdminLayout component
  // Server-side auth check removed since we're using Firebase client-side auth

  // Parse query parameters - searchParams is already available, no need to await
  const pageParam = searchParams?.page;
  const limitParam = searchParams?.limit;
  const searchParam = searchParams?.search;
  const sortParam = searchParams?.sort;
  const orderParam = searchParams?.order;

  const page = parseInt(pageParam || '1');
  const limit = parseInt(limitParam || '10');
  const search = searchParam || '';
  const sort = sortParam || 'title';
  const order = (orderParam as 'asc' | 'desc') || 'asc';

  // Fetch ads with pagination
  const { ads, pagination } = await getAllAds(
    page,
    limit,
    search,
    sort,
    order as 'asc' | 'desc'
  );

  // Helper function to safely format dates
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'yyyy-MM-dd');
  };

  // Helper function to generate sort URL
  const getSortUrl = (field: string) => {
    const newOrder = sort === field && order === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: field,
      order: newOrder
    });
    if (search) params.set('search', search);
    return `?${params.toString()}`;
  };

  // Helper function to generate pagination URL
  const getPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams({
      page: newPage.toString(),
      limit: limit.toString(),
      sort,
      order
    });
    if (search) params.set('search', search);
    return `?${params.toString()}`;
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('adsManagement.title')}</h1>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <form action={`/admin/ads`} method="GET">
            <Input
              type="text"
              name="search"
              placeholder={t('adsManagement.searchPlaceholder')}
              defaultValue={search}
              className="bg-white pr-4 ltr:pl-10 rtl:pr-10"
            />
            <Search className="absolute top-1/2 ltr:left-3 rtl:right-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="order" value={order} />
            <Button type="submit" className="sr-only">
              Search
            </Button>
          </form>
        </div>

        <div className="flex items-center space-x-2">
          <LimitSelector
            currentLimit={limit}
            baseUrl="/admin/ads"
            searchParams={{
              sort,
              order,
              ...(search ? { search } : {})
            }}
          />
        </div>
      </div>

      {/* Ads Table */}
      <div className="rounded-md border bg-white">
        <div className="p-4 border-b">
          <AddAdForm />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <a href={getSortUrl('title')} className="flex items-center">
                  {t('adsManagement.table.title')}
                  {sort === 'title' && (
                    <span className="ml-1">
                      {order === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </a>
              </TableHead>

              <TableHead>{t('adsManagement.table.tags')}</TableHead>
              <TableHead>{t('adsManagement.table.image')}</TableHead>
              <TableHead>
                <a href={getSortUrl('createdAt')} className="flex items-center">
                  {t('adsManagement.table.created')}
                  {sort === 'createdAt' && (
                    <span className="ml-1">
                      {order === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </a>
              </TableHead>
              <TableHead className="text-right">{t('adsManagement.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t('adsManagement.table.noAds')}
                </TableCell>
              </TableRow>
            ) : (
              ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium">{ad.title}</TableCell>
                  <TableCell>
                    {ad.tags && ad.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ad.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {ad.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{ad.tags.length - 3} {t('adActions.moreTags')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">{t('adActions.noTags')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <AdImageThumbnail 
                      src={ad.content} 
                      alt={ad.title} 
                      title={ad.title}
                    />
                  </TableCell>
                  <TableCell>{formatDate(ad.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <AdActions ad={ad} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        baseUrl="/admin/ads"
        searchParams={{
          limit: limit.toString(),
          sort,
          order,
          ...(search ? { search } : {})
        }}
      />
    </div>
  );
}
