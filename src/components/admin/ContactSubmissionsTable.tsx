'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTablePagination } from '@/components/admin/DataTablePagination';
import { LimitSelector } from '@/components/admin/LimitSelector';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, Search, Mail, Phone, User, MessageSquare } from 'lucide-react';
import ContactSubmissionActions from '@/components/admin/ContactSubmissionActions';
import { type ContactSubmission } from '@/lib/actions/admin';
import { useTranslations } from 'next-intl';

interface ContactSubmissionsTableProps {
  submissions: ContactSubmission[];
  pagination: {
    page: number;
    limit: number;
    totalSubmissions: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  searchParams: {
    page: string;
    limit: string;
    search: string;
    sort: string;
    order: string;
    unread?: string;
  };
}

export default function ContactSubmissionsTable({
  submissions,
  pagination,
  searchParams
}: ContactSubmissionsTableProps) {
  const router = useRouter();
  const t = useTranslations('Admin');
  const [search, setSearch] = useState(searchParams.search);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'yyyy-MM-dd HH:mm');
  };

  const getSortUrl = (field: string) => {
    const newOrder = searchParams.sort === field && searchParams.order === 'desc' ? 'asc' : 'desc';
    const params = new URLSearchParams({
      page: searchParams.page,
      limit: searchParams.limit,
      sort: field,
      order: newOrder
    });
    if (search) params.set('search', search);
    if (searchParams.unread) params.set('unread', 'true');
    return `?${params.toString()}`;
  };

  const getFilterUrl = (unread: boolean | null) => {
    const params = new URLSearchParams({
      page: '1',
      limit: searchParams.limit,
      sort: searchParams.sort,
      order: searchParams.order
    });
    if (search) params.set('search', search);
    if (unread !== null) params.set('unread', unread.toString());
    return `?${params.toString()}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      page: '1',
      limit: searchParams.limit,
      sort: searchParams.sort,
      order: searchParams.order
    });
    if (search) params.set('search', search);
    if (searchParams.unread) params.set('unread', 'true');
    router.push(`?${params.toString()}`);
  };

  const unreadOnly = searchParams.unread === 'true';

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <form onSubmit={handleSearch}>
            <Input
              type="text"
              placeholder={t('contactSubmissions.searchPlaceholderShort')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white pr-4 pl-10"
            />
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
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
              {t('contactSubmissions.filters.all')}
            </a>
            <a
              href={getFilterUrl(true)}
              className={`px-3 py-1 rounded text-sm ${
                unreadOnly
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('contactSubmissions.filters.unreadOnly')}
            </a>
          </div>
          <LimitSelector
            currentLimit={parseInt(searchParams.limit)}
            baseUrl="/admin/contact"
            searchParams={{
              sort: searchParams.sort,
              order: searchParams.order,
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
              <TableHead>{t('contactSubmissions.table.contactInfo')}</TableHead>
              <TableHead>{t('contactSubmissions.table.message')}</TableHead>
              <TableHead>{t('contactSubmissions.table.status')}</TableHead>
              <TableHead>
                <a href={getSortUrl('createdAt')} className="flex items-center">
                  {t('contactSubmissions.table.submitted')}
                  {searchParams.sort === 'createdAt' && (
                    <span className="ml-1">
                      {searchParams.order === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </a>
              </TableHead>
              <TableHead className="text-right">{t('contactSubmissions.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t('contactSubmissions.table.noSubmissions')}
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id} className={!submission.isRead ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{submission.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {submission.email}
                      </div>
                      {submission.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {submission.phone}
                        </div>
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
                      {submission.isRead ? t('contactSubmissions.table.read') : t('contactSubmissions.table.unread')}
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
        baseUrl="/admin/contact"
        searchParams={{
          limit: searchParams.limit,
          sort: searchParams.sort,
          order: searchParams.order,
          ...(search ? { search } : {}),
          ...(unreadOnly ? { unread: 'true' } : {})
        }}
      />
    </div>
  );
}
