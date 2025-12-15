import Navbar from '@/src/components/layout/Navbar';
import AuthGuard from '@/src/components/auth/AuthGuard';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <AuthGuard>
      <Navbar />
      <div className="flex grow flex-col pt-20 p-4">{children}</div>
    </AuthGuard>
  );
};

export default Layout;