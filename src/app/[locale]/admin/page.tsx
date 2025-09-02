// import { auth } from '@/auth'; // Removed - using Firebase Auth
import { redirect } from '@/i18n/routing';
import { getDashboardStats, getRecentActivity } from '@/lib/actions/admin';
import { format } from 'date-fns';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function AdminPage() {
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

  // Fetch dashboard statistics
  const stats = await getDashboardStats();
  const activity = await getRecentActivity();

  const isSuperAdmin = session.user.role === 'super_admin';

  // Helper function to safely format dates
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'yyyy-MM-dd');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold">{t('dashboard')}</h1>

      {/* User Welcome Card */}
      <div className="mb-6 flex rounded-lg bg-white p-6 shadow-md">
        <div>
          <h2 className="mb-3 text-xl font-semibold">{t('welcome')}</h2>
          <p className="mb-4 text-gray-700">
            {t('loggedInAs')}{' '}
            <span className="font-medium">{session.user.name}</span>
          </p>
        </div>
        <div className="ml-auto text-right">
          <h2 className="mb-3 text-xl font-semibold">
            {format(new Date(), 'dd/MM/yyyy')}
          </h2>
          <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {session.user.role}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Users Stats */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">User Statistics</h3>
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.users.total}
              </div>
              <div className="mt-1 text-xs text-gray-500">Total Users</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.users.new}
              </div>
              <div className="mt-1 text-xs text-gray-500">New (30d)</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.users.byRole?.admin || 0}
              </div>
              <div className="mt-1 text-xs text-gray-500">Admins</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.users.byRole?.user || 0}
              </div>
              <div className="mt-1 text-xs text-gray-500">Regular Users</div>
            </div>
          </div>
        </div>

        {/* Ads Stats */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ad Statistics</h3>
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.ads.total}
              </div>
              <div className="mt-1 text-xs text-gray-500">Total Ads</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.ads.byStatus?.active || 0}
              </div>
              <div className="mt-1 text-xs text-gray-500">Active</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {stats.ads.byStatus?.scheduled || 0}
              </div>
              <div className="mt-1 text-xs text-gray-500">Scheduled</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.ads.byStatus?.inactive || 0}
              </div>
              <div className="mt-1 text-xs text-gray-500">Inactive</div>
            </div>
          </div>
        </div>

        {/* Pets Stats */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pet Statistics</h3>
            <div className="rounded-lg bg-red-100 p-2 text-red-800">
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
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-6xl font-bold text-blue-600">
                {stats.pets.total}
              </div>
              <div className="mt-1 text-xs text-gray-500">Total Pets</div>
            </div>

            <div className="mt-2 text-center text-xs text-gray-500">
              Pets are the core of our platform. Each pet has a unique profile
              with details about their owner, vet, and breed.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold">Recent Users</h3>
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
                {activity.recentUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{user.fullName}</td>
                    <td className="p-2 text-sm text-gray-600">{user.email}</td>
                    <td className="p-2 text-sm">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
                {activity.recentUsers.length === 0 && (
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
          <h3 className="mb-4 text-lg font-semibold">Recent Ads</h3>
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
                {activity.recentAds.map((ad) => (
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
                {activity.recentAds.length === 0 && (
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

      {/* Admin Actions */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">{t('adsManagement')}</h2>
          <p className="mb-4 text-gray-700">{t('manageAdsDescription')}</p>
          <Link
            href={`/${locale}/admin/ads`}
            className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
          >
            {t('manageAds')}
          </Link>
        </div>

        {isSuperAdmin && (
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">
              {t('userManagement')}
            </h2>
            <p className="mb-4 text-gray-700">{t('manageUsersDescription')}</p>
            <Link
              href={`/${locale}/admin/users`}
              className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
            >
              {t('manageUsers')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
