import { auth } from '@/auth';
import { redirect } from '@/i18n/routing';
import { Button } from '@/src/components/ui/button';
import { AppWindow, ArrowLeft, LayoutDashboard, Users } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const locale = await getLocale();

  // Server-side role check
  if (
    !session?.user ||
    (session.user.role !== 'admin' && session.user.role !== 'super_admin')
  ) {
    return redirect({ href: '/', locale });
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
            {session.user.role === 'super_admin' && (
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
