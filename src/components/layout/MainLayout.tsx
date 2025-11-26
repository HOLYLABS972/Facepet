'use client';

import { DirectionProvider } from '@radix-ui/react-direction';
import { Toaster } from 'react-hot-toast';
import AdDisplayManager from '@/components/AdDisplayManager';

interface MainLayoutProps {
  children: React.ReactNode;
  direction: 'ltr' | 'rtl';
}

const MainLayout = ({ children, direction }: MainLayoutProps) => {
  return (
    <main className="flex min-h-dvh flex-col m-0 p-0 pt-16">
      <DirectionProvider dir={direction}>
        <Toaster />
        <AdDisplayManager />
        {children}
      </DirectionProvider>
    </main>
  );
};

export default MainLayout;
