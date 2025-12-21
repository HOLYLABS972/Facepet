'use client';

import Navbar from '@/src/components/layout/Navbar';
import AuthGuard from '@/src/components/auth/AuthGuard';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const isMyPetsPage = pathname?.includes('/my-pets');
  const isVouchersPage = pathname?.includes('/vouchers');
  
  return (
    <AuthGuard>
      <Navbar />
      <div className={`flex grow flex-col ${isMyPetsPage ? 'pt-8' : isVouchersPage ? 'pt-8 px-4' : 'pt-20 p-4'}`}>{children}</div>
    </AuthGuard>
  );
};

export default Layout;