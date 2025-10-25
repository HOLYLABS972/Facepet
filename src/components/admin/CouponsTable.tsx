'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, Eye, Image } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Coupon } from '@/types/coupon';
import { getCoupons, updateCoupon, deleteCoupon } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';

export default function CouponsTable() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const result = await getCoupons();
      if (result.success) {
        setCoupons(result.coupons);
      } else {
        setError(result.error || 'Failed to fetch coupons');
      }
    } catch (err) {
      setError('Failed to fetch coupons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const result = await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      if (result.success) {
        setCoupons(prev => 
          prev.map(c => 
            c.id === coupon.id ? { ...c, isActive: !c.isActive } : c
          )
        );
      } else {
        setError(result.error || 'Failed to update coupon');
      }
    } catch (err) {
      setError('Failed to update coupon');
      console.error(err);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(t('couponsManagement.confirmDelete', { name: coupon.name }))) {
      return;
    }

    try {
      const result = await deleteCoupon(coupon.id);
      if (result.success) {
        setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      } else {
        setError(result.error || 'Failed to delete coupon');
      }
    } catch (err) {
      setError('Failed to delete coupon');
      console.error(err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded border border-red-400 bg-red-100 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('couponsManagement.name')}</TableHead>
              <TableHead>{t('couponsManagement.description')}</TableHead>
              <TableHead>{t('couponsManagement.price')}</TableHead>
              <TableHead>{t('couponsManagement.points')}</TableHead>
              <TableHead>{t('couponsManagement.image')}</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead>{t('couponsManagement.status')}</TableHead>
              <TableHead>{t('couponsManagement.createdAt')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {t('couponsManagement.noCoupons')}
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {coupon.description}
                  </TableCell>
                  <TableCell>{formatPrice(coupon.price)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {coupon.points} pts
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.imageUrl ? (
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <img 
                          src={coupon.imageUrl} 
                          alt={coupon.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                        <Image className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="space-y-1">
                      <div>From: {formatDate(coupon.validFrom)}</div>
                      <div>To: {formatDate(coupon.validTo)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(coupon.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleActive(coupon)}>
                          {coupon.isActive ? t('couponsManagement.deactivate') : t('couponsManagement.activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(coupon)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
