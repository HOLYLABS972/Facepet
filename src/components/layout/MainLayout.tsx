'use client';

import { DirectionProvider } from '@radix-ui/react-direction';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdDisplayManager from '@/components/AdDisplayManager';
import InstallBanner from '@/components/InstallBanner';
import Navbar from './Navbar';
import BottomNavigation from './BottomNavigation';

interface MainLayoutProps {
  children: React.ReactNode;
  direction: 'ltr' | 'rtl';
}

const MainLayout = ({ children, direction }: MainLayoutProps) => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthRoute = pathname?.startsWith('/auth');
  const { user, loading } = useAuth();

  // Remove background for non-authenticated users
  useEffect(() => {
    if (!loading) {
      if (!user) {
        document.body.classList.add('no-background');
      } else {
        document.body.classList.remove('no-background');
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('no-background');
    };
  }, [user, loading]);

  // Show bottom navigation on mobile for all users
  const showBottomNav = true;

  return (
    <main className="flex min-h-dvh flex-col m-0 p-0">
      <DirectionProvider dir={direction}>
        {!isAdminRoute && <Navbar />}
        {!isAdminRoute && <InstallBanner />}
        <div className={`flex min-h-dvh flex-col ${!isAdminRoute ? 'pt-16' : ''}`} id="main-content">
          <Toaster />
          {!isAdminRoute && <AdDisplayManager />}
          {children}
        </div>
        {showBottomNav && !isAdminRoute && <BottomNavigation />}
      </DirectionProvider>
    </main>
  );
};

export default MainLayout;
