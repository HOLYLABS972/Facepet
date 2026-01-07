import { getUserCouponById } from '@/src/lib/supabase/database/coupons';
import { redirect } from 'next/navigation';
import VoucherViewPageClient from '@/components/pages/VoucherViewPageClient';
import { getTranslations } from 'next-intl/server';

interface VoucherViewPageProps {
  params: {
    voucherId: string;
    locale: string;
  };
}

export default async function VoucherViewPage({ params }: VoucherViewPageProps) {
  const t = await getTranslations('components.UserCoupons');

  const { voucherId } = params;

  if (!voucherId) {
    redirect('/vouchers');
  }

  // Get user coupon (voucher)
  const result = await getUserCouponById(voucherId);

  if (!result.success || !result.userCoupon) {
    redirect('/vouchers');
  }

  return (
    <VoucherViewPageClient
      userCoupon={result.userCoupon}
    />
  );
}

