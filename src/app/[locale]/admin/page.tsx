import { auth } from '@/lib/auth-server';
import { redirect } from '@/i18n/routing';
import { getDashboardStats, getRecentActivity } from '@/lib/actions/admin';
import { format } from 'date-fns';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function AdminPage() {
  const t = await getTranslations('Admin');
  const locale = 'en'; // Force English for admin panel

  // Note: Authentication is handled client-side in AdminLayout component
  // Server-side auth check removed since we're using Firebase client-side auth

  // Fetch dashboard statistics
  const stats = await getDashboardStats();
  const activity = await getRecentActivity();
  
  // Ensure stats has the expected structure
  const safeStats = {
    users: stats?.users || { total: 0, new: 0, byRole: {} },
    ads: stats?.ads || { total: 0, byStatus: {}, byType: {} },
    pets: stats?.pets || { total: 0, new: 0 },
    contactSubmissions: stats?.contactSubmissions || { total: 0 },
    comments: stats?.comments || { total: 0 },
    rating: stats?.rating || { average: '0.0' }
  };
  
  // Ensure activity has the expected structure
  const safeActivity = {
    users: activity?.users || [],
    pets: activity?.pets || [],
    ads: activity?.ads || []
  };

  // isSuperAdmin will be determined client-side in AdminLayout

  // Helper function to safely format dates
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'yyyy-MM-dd');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold">{t('dashboard')}</h1>





      {/* Top Section - Statistics Overview */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Ads */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Total Ads</h3>
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
              {safeStats.ads.total}
            </div>
            <div className="mt-1 text-sm text-gray-500">Advertisements</div>
          </div>
        </div>

        {/* Contact Forms */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contact Forms</h3>
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
              {safeStats.contactSubmissions.total}
            </div>
            <div className="mt-1 text-sm text-gray-500">Submissions</div>
          </div>
        </div>

        {/* Ad Comments */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ad Comments</h3>
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
              {safeStats.comments.total}
            </div>
            <div className="mt-1 text-sm text-gray-500">Comments</div>
          </div>
        </div>

        {/* Rating */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Rating</h3>
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
              {safeStats.rating.average}
            </div>
            <div className="mt-1 text-sm text-gray-500">Average Rating</div>
          </div>
        </div>

        {/* Total Users */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Total Users</h3>
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
              {safeStats.users.total}
            </div>
            <div className="mt-1 text-sm text-gray-500">Users</div>
          </div>
        </div>

        {/* Total Pets */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Total Pets</h3>
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
              {safeStats.pets.total}
            </div>
            <div className="mt-1 text-sm text-gray-500">Pets</div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Management Tables */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Users</h3>
            <Link
              href={`/${locale}/admin/users`}
              className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
            >
              {t('manageUsers')}
            </Link>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="h-10 w-full border-b">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Joined</th>
                </tr>
              </thead>
              <tbody>
                {safeActivity.users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{user.fullName}</td>
                    <td className="p-2 text-sm text-gray-600">{user.email}</td>
                    <td className="p-2 text-sm">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
                {safeActivity.users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Ads</h3>
            <Link
              href={`/${locale}/admin/ads`}
              className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
            >
              {t('manageAds')}
            </Link>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="h-10 w-full border-b">
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {safeActivity.ads.map((ad) => (
                  <tr key={ad.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{ad.title}</td>
                    <td className="p-2 text-sm">{ad.type}</td>
                    <td className="p-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          ad.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : ad.status === 'scheduled'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ad.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {safeActivity.ads.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-center text-gray-500">
                      No ads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


    </div>
  );
}
