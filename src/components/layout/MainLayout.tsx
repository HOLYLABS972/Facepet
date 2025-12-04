'use client';

import { DirectionProvider } from '@radix-ui/react-direction';
import { Toaster } from 'react-hot-toast';
import AdDisplayManager from '@/components/AdDisplayManager';
import Navbar from './Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
  direction: 'ltr' | 'rtl';
}

const MainLayout = ({ children, direction }: MainLayoutProps) => {
  return (
    <main className="flex min-h-dvh flex-col m-0 p-0">
      <DirectionProvider dir={direction}>
        <Navbar />
        <div className="flex min-h-dvh flex-col pt-16">
          <Toaster />
          <AdDisplayManager />
          {children}
        </div>
      </DirectionProvider>
    </main>
  );
};

export default MainLayout;
