'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/src/components/ui/button';
import { AppWindow, ArrowLeft, LayoutDashboard, Users, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserFromFirestore } from '@/src/lib/firebase/users';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'super_admin' | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        const userResult = await getUserFromFirestore(user.uid);
        if (userResult.success && userResult.user) {
          setUserRole(userResult.user.role || 'user');
        } else {
          setUserRole('user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user');
      } finally {
        setRoleLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  // Show loading while checking authentication
  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!user || !userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
    router.push('/');
    return null;
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
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/admin/ads`}
                className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
              >
                <AppWindow className="h-6 w-6" />
                Manage Ads
              </Link>
            </li>
            {userRole === 'super_admin' && (
              <li>
                <Link
                  href={`/${locale}/admin/users`}
                  className="flex gap-3 rounded p-2 transition hover:bg-white hover:shadow-xs"
                >
                  <Users className="h-6 w-6" />
                  Manage Users
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* User info */}
        <div className="mt-8 p-2 bg-white/10 rounded">
          <p className="text-sm text-gray-600">Logged in as:</p>
          <p className="font-medium">{user.email}</p>
          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
        </div>

        {/* Positioned at the bottom of the sidebar */}
        <div className="absolute bottom-8 left-0 w-full p-2">
          <Link href={`/${locale}`}>
            <Button
              variant="ghost"
              className="justify-center- hover:text-primary w-full items-center gap-2 align-middle hover:shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back to Website</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-background flex-1">{children}</div>
    </div>
  );
}
