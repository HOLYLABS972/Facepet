'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, getRecentActivity } from '@/lib/actions/admin';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminDashboard() {
  const t = useTranslations('Admin');
  
  // Get locale from URL or default to 'en'
  const locale = typeof window !== 'undefined' 
    ? window.location.pathname.split('/')[1] || 'en'
    : 'en';

  const [stats, setStats] = useState({
    users: { total: 0, new: 0, byRole: {} },
    ads: { total: 0, byStatus: {}, byType: {} },
    pets: { total: 0, new: 0 },
    contactSubmissions: { total: 0 },
    comments: { total: 0 },
    rating: { average: '0.0' }
  });
  
  const [activity, setActivity] = useState({
    users: [],
    pets: [],
    ads: []
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          getDashboardStats(),
          getRecentActivity()
        ]);
        
        setStats(statsData || {
          users: { total: 0, new: 0, byRole: {} },
          ads: { total: 0, byStatus: {}, byType: {} },
          pets: { total: 0, new: 0 },
          contactSubmissions: { total: 0 },
          comments: { total: 0 },
          rating: { average: '0.0' }
        });
        
        setActivity(activityData || {
          users: [],
          pets: [],
          ads: []
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to safely format dates
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'yyyy-MM-dd');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="mb-6 text-2xl md:text-3xl font-bold">{t('dashboard')}</h1>

      {/* Top Section - Statistics Overview */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {/* Total Ads */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('stats.totalAds')}</h3>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {stats.ads.total}
            </div>
            <div className="mt-1 text-sm text-gray-500">{t('stats.advertisements')}</div>
          </div>
        </div>

        {/* Contact Forms */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('stats.contactForms')}</h3>
            <div className="rounded-lg bg-green-100 p-2 text-green-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {stats.contactSubmissions.total}
            </div>
            <div className='mt-1 text-sm text-gray-500'>{t('stats.submissions')}</div>
          </div>
        </div>

        {/* Ad Comments */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('stats.totalComments')}</h3>
            <div className="rounded-lg bg-purple-100 p-2 text-purple-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">
              {stats.comments.total}
            </div>
            <div className='mt-1 text-sm text-gray-500'>{t('stats.comments')}</div>
          </div>
        </div>

        {/* Rating */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('stats.rating')}</h3>
            <div className="rounded-lg bg-yellow-100 p-2 text-yellow-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600">
              {stats.rating.average}
            </div>
            <div className='mt-1 text-sm text-gray-500'>{t('stats.averageRating')}</div>
          </div>
        </div>

        {/* Total Users */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('stats.totalUsers')}</h3>
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600">
              {stats.users.total}
            </div>
            <div className='mt-1 text-sm text-gray-500'>{t('stats.users')}</div>
          </div>
        </div>

        {/* Total Pets */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('stats.totalPets')}</h3>
            <div className="rounded-lg bg-pink-100 p-2 text-pink-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-600">
              {stats.pets.total}
            </div>
            <div className='mt-1 text-sm text-gray-500'>{t('stats.pets')}</div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Management Tables */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href={`/${locale}/admin/users`}
              className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 rtl:order-2"
            >
              {t('manageUsers')}
            </Link>
            <h3 className="text-lg font-semibold text-right rtl:text-right rtl:order-1">{t('userActivity')}</h3>
          </div>
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('usersManagement.table.name')}</TableHead>
                  <TableHead>{t('usersManagement.table.email')}</TableHead>
                  <TableHead>{t('usersManagement.table.joined')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {activity.users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className='text-center text-gray-500'>
                      {t('noActivity')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href={`/${locale}/admin/ads`}
              className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 rtl:order-2"
            >
              {t('adsManagement.manageAds')}
            </Link>
            <h3 className="text-lg font-semibold text-right rtl:text-right rtl:order-1">{t('adActivity')}</h3>
          </div>
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adsManagement.table.title')}</TableHead>
                  <TableHead>{t('adsManagement.table.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>{ad.title}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          ad.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : ad.status === 'scheduled'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {t(`adsManagement.status.${ad.status}`)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {activity.ads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className='text-center text-gray-500'>
                      {t('noActivity')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
