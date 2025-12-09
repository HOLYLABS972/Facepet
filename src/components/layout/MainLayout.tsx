'use client';

import { DirectionProvider } from '@radix-ui/react-direction';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import AdDisplayManager from '@/components/AdDisplayManager';
import InstallBanner from '@/components/InstallBanner';
import Navbar from './Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
  direction: 'ltr' | 'rtl';
}

const MainLayout = ({ children, direction }: MainLayoutProps) => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  
  return (
    <main className="flex min-h-dvh flex-col m-0 p-0">
      <DirectionProvider dir={direction}>
        <InstallBanner />
        <Navbar />
        <div className="flex min-h-dvh flex-col pt-16" id="main-content">
          <Toaster />
          {!isAdminRoute && <AdDisplayManager />}
          {children}
        </div>
      </DirectionProvider>
    </main>
  );
};

export default MainLayout;
