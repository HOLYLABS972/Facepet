'use client';

import { DirectionProvider } from '@radix-ui/react-direction';
import { Toaster } from 'react-hot-toast';
import ProfileCompletionGuard from '@/components/auth/ProfileCompletionGuard';

interface MainLayoutProps {
  children: React.ReactNode;
  direction: 'ltr' | 'rtl';
}

const MainLayout = ({ children, direction }: MainLayoutProps) => {
  return (
    <main className="flex min-h-dvh flex-col">
      <DirectionProvider dir={direction}>
        <Toaster />
        <ProfileCompletionGuard>
          {children}
        </ProfileCompletionGuard>
      </DirectionProvider>
    </main>
  );
};

export default MainLayout;
