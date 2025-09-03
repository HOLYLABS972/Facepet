import { getAllContactSubmissions } from '@/lib/actions/admin';
import { DataTablePagination } from '@/components/admin/DataTablePagination';
import { LimitSelector } from '@/components/admin/LimitSelector';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import ContactSubmissionActions from '@/components/admin/ContactSubmissionActions';

export default async function ContactSubmissionsPage({
  searchParams
}: {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    unread?: string;
  };
}) {
  const t = await getTranslations('Admin');

  const pageParam = searchParams?.page;
  const limitParam = searchParams?.limit;
  const searchParam = searchParams?.search;
  const sortParam = searchParams?.sort;
  const orderParam = searchParams?.order;
  const unreadParam = searchParams?.unread;

  const page = parseInt(pageParam || '1');
  const limit = parseInt(limitParam || '10');
  const search = searchParam || '';
  const sort = sortParam || 'createdAt';
  const order = (orderParam as 'asc' | 'desc') || 'desc';
  const unreadOnly = unreadParam === 'true';

  const { submissions, pagination } = await getAllContactSubmissions(
    page,
    limit,
    search,
    sort,
    order as 'asc' | 'desc',
    unreadOnly
  );

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'yyyy-MM-dd HH:mm');
  };

  const getSortUrl = (field: string) => {
    const newOrder = sort === field && order === 'desc' ? 'asc' : 'desc';
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: field,
      order: newOrder
    });
    if (search) params.set('search', search);
    if (unreadOnly) params.set('unread', 'true');
    return `?${params.toString()}`;
  };

  const getFilterUrl = (unread: boolean | null) => {
    const params = new URLSearchParams({
      page: '1',
      limit: limit.toString(),
      sort,
      order
    });
    if (search) params.set('search', search);
    if (unread !== null) params.set('unread', unread.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contact Submissions</h1>
        <p className="text-gray-600 mt-2">View and manage contact form submissions from users</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <form action={`/admin/contact-submissions`} method="GET">
            <Input
              type="text"
              name="search"
              placeholder="Search by name, email, subject, or message..."
              defaultValue={search}
              className="bg-white pr-4 pl-10"
            />
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="order" value={order} />
            {unreadOnly && <input type="hidden" name="unread" value="true" />}
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex gap-2">
            <a
              href={getFilterUrl(null)}
              className={`px-3 py-1 rounded text-sm ${
                !unreadOnly
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </a>
            <a
              href={getFilterUrl(true)}
              className={`px-3 py-1 rounded text-sm ${
                unreadOnly
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Unread Only
            </a>
          </div>
          <LimitSelector
            currentLimit={limit}
            baseUrl="/admin/contact-submissions"
            searchParams={{
              sort,
              order,
              ...(search ? { search } : {}),
              ...(unreadOnly ? { unread: 'true' } : {})
            }}
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact Info</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <a href={getSortUrl('createdAt')} className="flex items-center">
                  Submitted
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
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No contact submissions found.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id} className={!submission.isRead ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{submission.name}</div>
                      <div className="text-sm text-gray-600">{submission.email}</div>
                      {submission.phone && (
                        <div className="text-sm text-gray-600">{submission.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={submission.message}>
                      {submission.message}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        submission.isRead
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {submission.isRead ? 'Read' : 'Unread'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(submission.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <ContactSubmissionActions
                      submissionId={submission.id}
                      isRead={submission.isRead}
                      submission={submission}
                    />
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
        baseUrl="/admin/contact-submissions"
        searchParams={{
          limit: limit.toString(),
          sort,
          order,
          ...(search ? { search } : {}),
          ...(unreadOnly ? { unread: 'true' } : {})
        }}
      />
    </div>
  );
}
