'use client';

import { useTranslations } from 'next-intl';
import AddPromoForm from '@/components/admin/AddPromoForm';
import PromosTable from '@/components/admin/PromosTable';

export default function PromosPage() {
  const t = useTranslations('Admin');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 rtl:md:flex-row-reverse">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('promoManagement.title')}
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            {t('promoManagement.description')}
          </p>
        </div>
        <AddPromoForm />
      </div>

      <PromosTable />
    </div>
  );
}

