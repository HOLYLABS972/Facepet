
import { DataTablePagination } from '@/components/admin/DataTablePagination';
import { LimitSelector } from '@/components/admin/LimitSelector';
import UserActions from '@/components/admin/UserActions';
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
import { getAllUsers } from '@/lib/actions/admin';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, Search, Coins, UserPlus } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }>;
}) {
  const t = await getTranslations('Admin');
  const locale = await getLocale();

  // Note: Authentication is handled client-side in AdminLayout component
  // Server-side auth check removed since we're using Firebase client-side auth

  // Parse query parameters - await searchParams
  const params = await searchParams;
  const pageParam = params?.page;
  const limitParam = params?.limit;
  const searchParam = params?.search;
  const sortParam = params?.sort;
  const orderParam = params?.order;

  const page = parseInt(pageParam || '1');
  const limit = parseInt(limitParam || '10');
  const search = searchParam || '';
  const sort = sortParam || 'fullName';
  const order = (orderParam as 'asc' | 'desc') || 'asc';

  // Fetch users with pagination
  const { users, pagination } = await getAllUsers(
    page,
    limit,
    search,
    sort,
    order as 'asc' | 'desc'
  );

  // Helper function to safely format dates
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy');
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

  // isSuperAdmin will be determined client-side in AdminLayout component

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('userManagement')}</h1>
        <Link href={`/${locale}/auth`}>
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {t('navigation.addUser')}
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <form action={`/admin/users`} method="GET">
            <Input
              type="text"
              name="search"
              placeholder={t('usersManagement.searchPlaceholder')}
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
            baseUrl="/admin/users"
            searchParams={{
              sort,
              order,
              ...(search ? { search } : {})
            }}
            translationPath="usersManagement"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <a href={getSortUrl('fullName')} className="flex items-center">
                  {t('usersManagement.table.name')}
                  {sort === 'fullName' && (
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
                <a href={getSortUrl('email')} className="flex items-center">
                  {t('usersManagement.table.email')}
                  {sort === 'email' && (
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
                <a href={getSortUrl('phone')} className="flex items-center">
                  {t('usersManagement.table.phone')}
                  {sort === 'phone' && (
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
                <a href={getSortUrl('role')} className="flex items-center">
                  {t('usersManagement.table.role')}
                  {sort === 'role' && (
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
                  {t('usersManagement.table.joined')}
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
              <TableHead>
                <a href={getSortUrl('points')} className="flex items-center">
                  {t('usersManagement.table.points')}
                  {sort === 'points' && (
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
              <TableHead className="text-right">{t('usersManagement.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t('usersManagement.table.noUsers')}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {t(`usersManagement.roles.${user.role}`)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      {user.points || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions
                      userId={user.id}
                      currentRole={user.role}
                      isSuperAdmin={user.role === 'super_admin'}
                      isRestricted={user.isRestricted}
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
        baseUrl="/admin/users"
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
