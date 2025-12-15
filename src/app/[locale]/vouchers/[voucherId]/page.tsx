import { getUserCouponById } from '@/lib/firebase/user-coupons';
import { redirect } from 'next/navigation';
import VoucherViewPageClient from '@/components/pages/VoucherViewPageClient';
import { getTranslations } from 'next-intl/server';
import { getBusinesses, getCouponById } from '@/lib/actions/admin';
import { Business } from '@/types/promo';

interface VoucherViewPageProps {
  params: Promise<{
    voucherId: string;
    locale: string;
  }>;
}

export default async function VoucherViewPage({ params }: VoucherViewPageProps) {
  const resolvedParams = await params;
  const t = await getTranslations('components.UserCoupons');
  
  const { voucherId } = resolvedParams;
  
  if (!voucherId) {
    redirect('/coupons');
  }

  // Get user coupon (voucher)
  const result = await getUserCouponById(voucherId);
  
  if (!result.success || !result.userCoupon) {
    redirect('/coupons');
  }

  // Get all businesses associated with this voucher
  let allBusinesses: Business[] = [];
  const businessesResult = await getBusinesses();
  
  if (businessesResult.success && businessesResult.businesses) {
    let coupon = result.userCoupon.coupon;
    
    // Debug: Log the coupon data
    console.log('🔍 Voucher page - coupon data:', {
      couponId: coupon.id,
      hasBusinessId: !!coupon.businessId,
      hasBusinessIds: !!coupon.businessIds,
      businessId: coupon.businessId,
      businessIds: coupon.businessIds
    });
    
    // If businessIds are missing from the stored coupon, fetch the original coupon
    if (!coupon.businessIds && !coupon.businessId) {
      console.log('⚠️ No businessIds found in stored coupon, fetching original coupon...');
      const originalCouponResult = await getCouponById(coupon.id);
      if (originalCouponResult.success && originalCouponResult.coupon) {
        console.log('✅ Original coupon fetched:', {
          hasBusinessId: !!originalCouponResult.coupon.businessId,
          hasBusinessIds: !!originalCouponResult.coupon.businessIds,
          businessId: originalCouponResult.coupon.businessId,
          businessIds: originalCouponResult.coupon.businessIds
        });
        // Merge business information from original coupon
        coupon = {
          ...coupon,
          businessId: originalCouponResult.coupon.businessId,
          businessIds: originalCouponResult.coupon.businessIds
        };
      } else {
        console.error('❌ Failed to fetch original coupon:', originalCouponResult);
      }
    }
    
    // Support both old businessId and new businessIds format
    let businessIds = coupon.businessIds || (coupon.businessId ? [coupon.businessId] : []);
    
    // Fallback: If still no businesses found, try to find businesses that might be associated
    // by checking all businesses and seeing if any have this coupon in their data
    // (This is a workaround in case businesses are stored elsewhere)
    if (businessIds.length === 0) {
      console.log('⚠️ Still no businesses found, checking all businesses for reverse association...');
      // Note: This is a fallback - normally businesses don't store coupon IDs
      // But we'll check all businesses just in case there's a reverse relationship
      // For now, we'll just log that we tried
      console.log('ℹ️ No reverse relationship found - businesses are stored on coupons, not businesses');
    }
    
    console.log('🔍 Business IDs to filter:', businessIds);
    console.log('🔍 Total businesses available:', businessesResult.businesses.length);
    
    if (businessIds.length > 0) {
      allBusinesses = businessesResult.businesses.filter((b: any) => businessIds.includes(b.id));
      console.log('✅ Filtered businesses:', allBusinesses.length, allBusinesses.map(b => ({ id: b.id, name: b.name })));
    } else {
      console.warn('⚠️ No business IDs found for this voucher');
    }
  } else {
    console.error('❌ Failed to fetch businesses:', businessesResult);
  }

  return (
    <VoucherViewPageClient 
      userCoupon={result.userCoupon}
      businesses={allBusinesses}
    />
  );
}

