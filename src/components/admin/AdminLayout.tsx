'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AppWindow, LayoutDashboard, Users, Loader2, ShieldX, MessageSquare, Settings, Mail, Ticket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserRole, type UserRole } from '@/lib/utils/admin';
import AdminInstallBanner from './AdminInstallBanner';
import AdminTopNav from './AdminTopNav';
import AdminBottomNav from './AdminBottomNav';
import InstallBanner from '@/components/InstallBanner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const t = useTranslations('Admin');

  // Get locale from URL or default to 'en'
  const locale = typeof window !== 'undefined'
    ? window.location.pathname.split('/')[1] || 'en'
    : 'en';
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        console.log('🔍 AdminLayout: No user, skipping role check');
        setRoleLoading(false);
        return;
      }

      console.log('🔍 AdminLayout: Checking role for user:', user.email);
      try {
        const role = await getUserRole(user);
        console.log('✅ AdminLayout: Role retrieved:', role);
        setUserRole(role);
      } catch (error) {
        console.error('❌ AdminLayout: Error fetching user role:', error);
        console.error('Error details:', error);
        setUserRole('user'); // Default to 'user' instead of null
      } finally {
        setRoleLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-auto">
          <ShieldX className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('unauthorized')}</h1>
          <p className="text-gray-600 mb-6">
            {t('unauthorizedMessage')}
          </p>
          <div className="space-y-3">
            <Link href={`/${locale}`}>
              <Button className="w-full">
                {t('goBack')}
              </Button>
            </Link>
            <Link href={`/${locale}/signin`}>
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <AdminTopNav
          userEmail={user.email || ''}
          userRole={userRole ? t(`roles.${userRole}`) : 'Loading...'}
          locale={locale}
        />

      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block bg-secondary-background text-primary sticky top-0 h-screen w-64 p-4">
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                href={`/${locale}/admin`}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <LayoutDashboard className="h-6 w-6" />
                {t('navigation.dashboard')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/ads`}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <AppWindow className="h-6 w-6" />
                {t('navigation.manageAds')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/comments`}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <MessageSquare className="h-6 w-6" />
                {t('navigation.manageComments')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/contact-submissions`}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <Mail className="h-6 w-6" />
                {t('navigation.contactSubmissions')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/settings`}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <Settings className="h-6 w-6" />
                {t('navigation.settings')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/coupons`}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <Ticket className="h-6 w-6" />
                {t('navigation.manageCoupons')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/users`}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <Users className="h-6 w-6" />
                {t('navigation.manageUsers')}
              </Link>
            </li>
          </ul>
        </nav>

        {/* User info */}
        <div className="mt-8 p-2 bg-white/10 rounded">
          <p className="font-medium truncate">{user.email}</p>
          <p className="text-xs text-gray-500 capitalize">{userRole ? t(`roles.${userRole}`) : 'Loading...'}</p>
        </div>
      </div>

      {/* Desktop Install Banner - Positioned to account for sidebar */}
      <div className="hidden md:block fixed top-0 left-64 right-0 z-40">
        <InstallBanner />
      </div>

      {/* Main content */}
      <div className="bg-background flex-1 w-full">
        {/* Mobile: Add top padding for fixed top nav (banner will add its own space) */}
        <AdminInstallBanner />


        {/* Content - Add padding top for banner on desktop */}
        <div className='flex-1'>
          {children}
        </div>
      </div>
    </div>
  );
}
