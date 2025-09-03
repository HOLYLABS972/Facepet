import { getAllComments } from '@/lib/actions/admin';
import { DataTablePagination } from '@/components/admin/DataTablePagination';
import { LimitSelector } from '@/components/admin/LimitSelector';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import CommentActions from '@/components/admin/CommentActions';

export default async function CommentsPage({
  searchParams
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    approved?: string;
  }>;
}) {
  const t = await getTranslations('Admin');
  const params = await searchParams;

  const pageParam = params?.page;
  const limitParam = params?.limit;
  const searchParam = params?.search;
  const sortParam = params?.sort;
  const orderParam = params?.order;
  const approvedParam = params?.approved;

  const page = parseInt(pageParam || '1');
  const limit = parseInt(limitParam || '10');
  const search = searchParam || '';
  const sort = sortParam || 'createdAt';
  const order = (orderParam as 'asc' | 'desc') || 'desc';
  const approvedOnly = approvedParam === 'true';

  const { comments, pagination } = await getAllComments(
    page,
    limit,
    search,
    sort,
    order as 'asc' | 'desc',
    approvedOnly
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
    if (approvedOnly) params.set('approved', 'true');
    return `?${params.toString()}`;
  };

  const getFilterUrl = (approved: boolean | null) => {
    const params = new URLSearchParams({
      page: '1',
      limit: limit.toString(),
      sort,
      order
    });
    if (search) params.set('search', search);
    if (approved !== null) params.set('approved', approved.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Comments</h1>
        <p className="text-gray-600 mt-2">Review and manage user comments and reviews</p>
      </div>

      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <form action={`/admin/comments`} method="GET">
            <Input
              type="text"
              name="search"
              placeholder="Search by content, user name, or email..."
              defaultValue={search}
              className="bg-white pr-4 pl-10"
            />
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="order" value={order} />
            {approvedOnly && <input type="hidden" name="approved" value="true" />}
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
                approvedOnly === false
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </a>
            <a
              href={getFilterUrl(true)}
              className={`px-3 py-1 rounded text-sm ${
                approvedOnly === true
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Approved Only
            </a>
          </div>
          <LimitSelector
            currentLimit={limit}
            baseUrl="/admin/comments"
            searchParams={{
              sort,
              order,
              ...(search ? { search } : {}),
              ...(approvedOnly ? { approved: 'true' } : {})
            }}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Ad/Service</TableHead>
              <TableHead>Status</TableHead>
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
            {comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No comments found.
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{comment.userName}</div>
                      <div className="text-sm text-gray-500">{comment.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={comment.content}>
                      {comment.content}
                    </div>
                  </TableCell>
                  <TableCell>
                    {comment.rating ? (
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1">{comment.rating}/5</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No rating</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {comment.adTitle ? (
                      <div className="text-sm">
                        <div className="font-medium">{comment.adTitle}</div>
                        <div className="text-gray-500">ID: {comment.adId}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">General comment</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        comment.isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {comment.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(comment.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <CommentActions
                      commentId={comment.id}
                      content={comment.content}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        baseUrl="/admin/comments"
        searchParams={{
          limit: limit.toString(),
          sort,
          order,
          ...(search ? { search } : {}),
          ...(approvedOnly ? { approved: 'true' } : {})
        }}
      />
    </div>
  );
}
