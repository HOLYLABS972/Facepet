'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AppWindow, ArrowLeft, LayoutDashboard, Users, Loader2, ShieldX, MessageSquare, Phone, Settings, Mail, Ticket, Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserRole, type UserRole } from '@/lib/utils/admin';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="flex min-h-screen relative">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg md:hidden"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div className={`
        bg-secondary-background text-primary fixed md:sticky md:top-0 h-screen w-64 p-4 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <h1 className="text-primary mb-4 p-2 font-['Lobster'] text-4xl">
          {t('brand')}
        </h1>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                href={`/${locale}/admin`}
                onClick={() => setSidebarOpen(false)}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <LayoutDashboard className="h-6 w-6" />
                {t('navigation.dashboard')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/ads`}
                onClick={() => setSidebarOpen(false)}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <AppWindow className="h-6 w-6" />
                {t('navigation.manageAds')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/comments`}
                onClick={() => setSidebarOpen(false)}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <MessageSquare className="h-6 w-6" />
                {t('navigation.manageComments')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/contact-submissions`}
                onClick={() => setSidebarOpen(false)}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <Mail className="h-6 w-6" />
                {t('navigation.contactSubmissions')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/settings`}
                onClick={() => setSidebarOpen(false)}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <Settings className="h-6 w-6" />
                {t('navigation.settings')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/coupons`}
                onClick={() => setSidebarOpen(false)}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <Ticket className="h-6 w-6" />
                {t('navigation.manageCoupons')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/users`}
                onClick={() => setSidebarOpen(false)}
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

        {/* Positioned at the bottom of the sidebar */}
        <div className="absolute bottom-8 left-0 w-full p-2">
          <Link href={`/${locale}`} onClick={() => setSidebarOpen(false)}>
            <Button
              variant="ghost"
              className="justify-center hover:text-primary w-full items-center gap-2 align-middle hover:shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('goBack')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-background flex-1 w-full md:ml-0">
        <div className="md:hidden pt-16">{/* Spacer for mobile menu button */}</div>
        {children}
      </div>
    </div>
  );
}
