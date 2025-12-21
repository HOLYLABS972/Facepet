'use client';

import { useTranslations } from 'next-intl';
import AddAdForm from '@/components/admin/AddAdForm';
import AdsTable from '@/components/admin/AdsTable';

interface AdsPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    tab?: string;
  };
}

export default function AdsPage({ searchParams }: AdsPageProps) {
  const t = useTranslations('Admin');

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 rtl:md:flex-row-reverse">
          <AddAdForm />
            <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t('adsManagement.title')}
            </h1>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
              {t('adsManagement.description')}
              </p>
          </div>
          </div>
          
        <AdsTable />
          </div>
    </div>
  );
}
