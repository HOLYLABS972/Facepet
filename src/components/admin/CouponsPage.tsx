'use client';

import { useTranslations } from 'next-intl';
import AddCouponForm from '@/components/admin/AddCouponForm';
import CouponsTable from '@/components/admin/CouponsTable';

export default function CouponsPage() {
  const t = useTranslations('Admin');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('couponsManagement.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('couponsManagement.description')}
          </p>
        </div>
        <AddCouponForm />
      </div>

      <CouponsTable />
    </div>
  );
}
