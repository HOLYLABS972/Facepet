'use client';

import { useTranslations } from 'next-intl';
import AddBusinessForm from '@/components/admin/AddBusinessForm';
import BusinessesTable from '@/components/admin/BusinessesTable';

export default function BusinessesPage() {
  const t = useTranslations('Admin');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 rtl:flex-row-reverse">
        <AddBusinessForm />
        <div className="text-left rtl:text-right">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('businessManagement.title')}
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            {t('businessManagement.description')}
          </p>
        </div>
      </div>

      <BusinessesTable />
    </div>
  );
}

