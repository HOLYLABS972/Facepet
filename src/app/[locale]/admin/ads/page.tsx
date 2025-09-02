// import { auth } from '@/auth'; // Removed - using Firebase Auth
import AdActions from '@/components/admin/AdActions';
import AddAdForm from '@/components/admin/AddAdForm';
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
  const session = await auth();
  const t = await getTranslations('Admin');
  const locale = await getLocale();

  // Double-check authorization server-side
  if (
    !session?.user ||
    (session.user.role !== 'admin' && session.user.role !== 'super_admin')
  ) {
    return redirect({ href: '/', locale });
  }

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('adsManagement')}</h1>
        <AddAdForm />
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <form action={`/admin/ads`} method="GET">
            <Input
              type="text"
              name="search"
              placeholder="Search by title..."
              defaultValue={search}
              className="bg-white pr-4 pl-10"
            />
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <a href={getSortUrl('title')} className="flex items-center">
                  Title
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
              <TableHead>
                <a href={getSortUrl('type')} className="flex items-center">
                  Type
                  {sort === 'type' && (
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
              <TableHead>
                <a href={getSortUrl('status')} className="flex items-center">
                  Status
                  {sort === 'status' && (
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
              <TableHead>
                <a href={getSortUrl('duration')} className="flex items-center">
                  Duration (s)
                  {sort === 'duration' && (
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
              <TableHead>
                <a href={getSortUrl('createdAt')} className="flex items-center">
                  Created
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No advertisements found.
                </TableCell>
              </TableRow>
            ) : (
              ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium">{ad.title}</TableCell>
                  <TableCell>{ad.type}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        ad.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : ad.status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ad.status}
                    </span>
                  </TableCell>
                  <TableCell>{ad.duration}s</TableCell>
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
