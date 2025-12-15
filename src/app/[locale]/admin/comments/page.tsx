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
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
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
        <h1 className="text-3xl font-bold">{t('commentsManagementPage.title')}</h1>
        <p className="text-gray-600 mt-2">{t('commentsManagementPage.description')}</p>
      </div>

      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <form action={`/admin/comments`} method="GET">
            <Input
              type="text"
              name="search"
              placeholder={t('commentsManagementPage.searchPlaceholder')}
              defaultValue={search}
              className="bg-white pr-4 pl-10"
            />
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="order" value={order} />
            {approvedOnly && <input type="hidden" name="approved" value="true" />}
            <button type="submit" className="sr-only">
              {t('commentsManagementPage.searchPlaceholder')}
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
              {t('commentsManagementPage.filters.all')}
            </a>
            <a
              href={getFilterUrl(true)}
              className={`px-3 py-1 rounded text-sm ${
                approvedOnly === true
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('commentsManagementPage.filters.approvedOnly')}
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
              <TableHead>{t('commentsManagementPage.table.user')}</TableHead>
              <TableHead>{t('commentsManagementPage.table.content')}</TableHead>
              <TableHead>{t('commentsManagementPage.table.rating')}</TableHead>
              <TableHead>{t('commentsManagementPage.table.adService')}</TableHead>
              <TableHead>{t('commentsManagementPage.table.status')}</TableHead>
              <TableHead>
                <a href={getSortUrl('createdAt')} className="flex items-center">
                  {t('commentsManagementPage.table.created')}
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
              <TableHead className="text-right">{t('commentsManagementPage.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t('commentsManagementPage.table.noComments')}
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
                      <span className="text-gray-400">{t('commentsManagementPage.table.noRating')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {comment.adTitle ? (
                      <div className="text-sm">
                        <div className="font-medium">{comment.adTitle}</div>
                        <div className="text-gray-500">ID: {comment.adId}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">{t('commentsManagementPage.table.generalComment')}</span>
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
                      {comment.isApproved ? t('commentsManagementPage.table.approved') : t('commentsManagementPage.table.pending')}
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
