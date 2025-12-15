'use client';

import { DirectionProvider } from '@radix-ui/react-direction';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import AdDisplayManager from '@/components/AdDisplayManager';
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
  const showBottomNav = !isAdminRoute; // Show on all routes except admin (including auth routes)
  
  return (
    <main className="flex min-h-dvh flex-col m-0 p-0">
      <DirectionProvider dir={direction}>
        <Navbar />
        <div className="flex min-h-dvh flex-col pt-16 pb-16 md:pb-0" id="main-content">
          <Toaster />
          {!isAdminRoute && <AdDisplayManager />}
          {children}
        </div>
        {showBottomNav && <BottomNavigation />}
      </DirectionProvider>
    </main>
  );
};

export default MainLayout;
