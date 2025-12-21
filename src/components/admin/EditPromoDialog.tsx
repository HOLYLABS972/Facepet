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
import { BusinessMultiselect } from '@/components/ui/business-multiselect';

import { updatePromo, getBusinesses } from '@/lib/actions/admin';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Business, Promo } from '@/types/promo';

interface EditPromoDialogProps {
  promo: Promo;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPromoDialog({ promo, isOpen, onClose, onSuccess }: EditPromoDialogProps) {
  const t = useTranslations('Admin');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    businessIds: [] as string[],
    startDate: '',
    endDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (promo) {
        // Support both old businessId and new businessIds format
        const businessIds = promo.businessIds || (promo.businessId ? [promo.businessId] : []);
        setFormData({
          name: promo.name || '',
          description: promo.description || '',
          imageUrl: promo.imageUrl || '',
          businessIds: businessIds,
          startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : '',
          endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : ''
        });
      }
    }
  }, [isOpen, promo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const businessesResult = await getBusinesses();

      if (businessesResult.success) {
        setBusinesses(businessesResult.businesses);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessIdsChange = (selectedIds: string[]) => {
    setFormData((prev) => ({
      ...prev,
      businessIds: selectedIds
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updatePromo(promo.id, {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        businessIds: formData.businessIds.length > 0 ? formData.businessIds : undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update promo');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating promo:', err);
      setError(err.message || 'Failed to update promo. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialogs.editPromo.title')}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('promoManagement.name')}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('promoManagement.namePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('promoManagement.description')}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('promoManagement.descriptionPlaceholder')}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">{t('promoManagement.image')}</Label>
            <MediaUpload
              type="image"
              value={formData.imageUrl}
              onChange={(filePath) => {
                setFormData((prev) => ({ ...prev, imageUrl: filePath }));
              }}
              className="w-1/5"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('promoManagement.business') || 'Businesses (Optional)'}</Label>
            <BusinessMultiselect
              businesses={businesses}
              selectedIds={formData.businessIds}
              onSelectionChange={handleBusinessIdsChange}
              placeholder={t('promoManagement.businessPlaceholder') || 'Select businesses (optional)'}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('promoManagement.startDate')}</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{t('promoManagement.endDate')}</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('dialogs.editPromo.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('dialogs.editPromo.updating') : t('dialogs.editPromo.update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
