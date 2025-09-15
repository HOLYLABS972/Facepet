'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { AppWindow, ArrowLeft, LayoutDashboard, Users, Loader2, ShieldX, MessageSquare, Phone, Settings, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserRole, isAdmin, isSuperAdmin, type UserRole } from '@/lib/utils/admin';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
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
        setRoleLoading(false);
        return;
      }

      try {
        const role = await getUserRole(user);
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setRoleLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  // Handle redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (!loading && !roleLoading && (!user || !isAdmin(userRole))) {
      router.push('/');
    }
  }, [user, userRole, loading, roleLoading, router]);

  // Show loading while checking authentication
  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Show unauthorized access screen if not authenticated or not admin
  if (!user || !isAdmin(userRole)) {
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
            {!user && (
              <Link href={`/${locale}/signin`}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="bg-secondary-background text-primary sticky top-0 h-screen w-64 p-4">
        <h1 className="text-primary mb-4 p-2 font-['Lobster'] text-4xl">
          FacePet
        </h1>
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
            {isAdmin(userRole) && (
              <li>
                <Link
                  href={`/${locale}/admin/users`}
                  className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
                >
                  <Users className="h-6 w-6" />
                  {t('navigation.manageUsers')}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* User info */}
        <div className="mt-8 p-2 bg-white/10 rounded">
          <p className="text-sm text-gray-600">{t('loggedInAs')}</p>
          <p className="font-medium">{user.email}</p>
          <p className="text-xs text-gray-500 capitalize">{t(`roles.${userRole}`)}</p>
        </div>

        {/* Positioned at the bottom of the sidebar */}
        <div className="absolute bottom-8 left-0 w-full p-2">
          <Link href={`/${locale}`}>
            <Button
              variant="ghost"
              className="justify-center- hover:text-primary w-full items-center gap-2 align-middle hover:shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('goBack')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-background flex-1">{children}</div>
    </div>
  );
}
