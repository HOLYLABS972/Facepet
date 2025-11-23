'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { createCoupon } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import MediaUpload from '@/components/admin/MediaUpload';

export default function AddCouponForm() {
  const t = useTranslations('Admin');
  const [isOpen, setIsOpen] = useState(false);
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

  const router = useRouter();

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

      console.log('Submitting coupon data:', formData);

      const result = await createCoupon({
        name: formData.name,
        description: formData.description,
        price: price,
        points: points,
        imageUrl: formData.imageUrl,
        validFrom: new Date(formData.validFrom),
        validTo: new Date(formData.validTo)
      }, 'admin'); // TODO: Get actual user ID

      console.log('Create coupon result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create coupon');
      }

      // Reset form and close
      setFormData({
        name: '',
        description: '',
        price: '',
        points: '',
        imageUrl: '',
        validFrom: '',
        validTo: ''
      });
      setIsOpen(false);

      // Refresh the page to show the new coupon
      window.location.reload();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Failed to create coupon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          {t('couponsManagement.addNewCoupon')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('couponsManagement.addNewCoupon')}</DialogTitle>
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

          <div className="space-y-2">
            <Label htmlFor="price">{t('couponsManagement.price')}</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
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
              min="0"
              value={formData.points}
              onChange={handleChange}
              placeholder={t('couponsManagement.pointsPlaceholder')}
              required
            />
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
                type="datetime-local"
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
                type="datetime-local"
                value={formData.validTo}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : t('couponsManagement.createCoupon')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
