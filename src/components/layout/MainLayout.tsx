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
import { initializeIOSOptimizations } from '@/lib/ios-optimization';

interface MainLayoutProps {
  children: React.ReactNode;
  direction: 'ltr' | 'rtl';
}

const MainLayout = ({ children, direction }: MainLayoutProps) => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthRoute = pathname?.startsWith('/auth');
  const { user, loading } = useAuth();

  // Initialize iOS optimizations on mount
  useEffect(() => {
    initializeIOSOptimizations();
  }, []);

  // Remove background for non-authenticated users
  // Body background class manipulation removed to prevent layout thrashing on mobile

  // Show bottom navigation on mobile for all users
  const showBottomNav = true;

  return (
    <main className="flex min-h-dvh flex-col m-0 p-0">
      <DirectionProvider dir={direction}>
        {!isAdminRoute && <Navbar />}
        {!isAdminRoute && <InstallBanner />}
        <div className={`flex min-h-dvh flex-col ${!isAdminRoute ? 'pt-16' : ''}`} id="main-content">
          <Toaster />
          {/* {!isAdminRoute && <AdDisplayManager />} */}
          {children}
        </div>
        {showBottomNav && !isAdminRoute && <BottomNavigation />}
      </DirectionProvider>
    </main>
  );
};

export default MainLayout;
