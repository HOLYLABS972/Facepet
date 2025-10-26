'use client';

import MediaUpload from '@/components/admin/MediaUpload';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateCoupon } from '@/lib/actions/admin';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Coupon } from '@/types/coupon';

interface EditCouponDialogProps {
  coupon: Coupon;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCouponDialog({ coupon, isOpen, onClose, onSuccess }: EditCouponDialogProps) {
  const t = useTranslations('Admin');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    points: '',
    imageUrl: '',
    validFrom: '',
    validTo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && coupon) {
      setFormData({
        name: coupon.name || '',
        description: coupon.description || '',
        price: coupon.price?.toString() || '',
        points: coupon.points?.toString() || '',
        imageUrl: coupon.imageUrl || '',
        validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
        validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().split('T')[0] : ''
      });
    }
  }, [isOpen, coupon]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const price = parseFloat(formData.price);
      const points = parseInt(formData.points);
      
      if (isNaN(price) || price < 0) {
        throw new Error('Please enter a valid price');
      }
      
      if (isNaN(points) || points < 0) {
        throw new Error('Please enter valid points');
      }

      const result = await updateCoupon(coupon.id, {
        name: formData.name,
        description: formData.description,
        price: price,
        points: points,
        imageUrl: formData.imageUrl,
        validFrom: new Date(formData.validFrom),
        validTo: new Date(formData.validTo)
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update coupon');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating coupon:', err);
      setError(err.message || 'Failed to update coupon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Coupon</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('couponsManagement.name')}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('couponsManagement.namePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('couponsManagement.description')}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('couponsManagement.descriptionPlaceholder')}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t('couponsManagement.price')}</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder={t('couponsManagement.pricePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">{t('couponsManagement.points')}</Label>
              <Input
                id="points"
                name="points"
                type="number"
                value={formData.points}
                onChange={handleChange}
                placeholder={t('couponsManagement.pointsPlaceholder')}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">{t('couponsManagement.image')}</Label>
            <MediaUpload
              type="image"
              value={formData.imageUrl}
              onChange={(filePath) => {
                setFormData((prev) => ({ ...prev, imageUrl: filePath }));
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">{t('couponsManagement.validFrom')}</Label>
              <Input
                id="validFrom"
                name="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validTo">{t('couponsManagement.validTo')}</Label>
              <Input
                id="validTo"
                name="validTo"
                type="date"
                value={formData.validTo}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Coupon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
