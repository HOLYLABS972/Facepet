'use client';

import { Button } from '@/src/components/ui/button';
import { useRouter } from '@/src/i18n/routing';
import { useTranslations } from 'next-intl';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const router = useRouter();
  const t = useTranslations('components.GoBackButton');
  return (
    <div className="flex grow flex-col items-center">
      {children}
      <Button
        onClick={() => router.back()}
        className="bg-primary mt-10 rounded-full font-normal hover:bg-[#ff6243]/90"
      >
        {t('buttonLabel')}
      </Button>
    </div>
  );
};

export default Layout;
