'use client';

import { useTranslations } from 'next-intl';
import AddCouponForm from '@/components/admin/AddCouponForm';
import CouponsTable from '@/components/admin/CouponsTable';

export default function CouponsPage() {
  const t = useTranslations('Admin');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="text-left rtl:text-right order-2 rtl:order-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-left rtl:text-right">
            {t('couponsManagement.title')}
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base text-left rtl:text-right">
            {t('couponsManagement.description')}
          </p>
        </div>
        <div className="order-1 rtl:order-2">
          <AddCouponForm />
        </div>
      </div>

      <CouponsTable />
    </div>
  );
}
