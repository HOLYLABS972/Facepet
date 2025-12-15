'use client';

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
import { AudienceMultiselect } from '@/components/ui/audience-multiselect';

import { updateFilter, getAudiences } from '@/lib/actions/admin';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Filter, Audience } from '@/types/promo';

interface EditFilterDialogProps {
  filter: Filter;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditFilterDialog({ filter, isOpen, onClose, onSuccess }: EditFilterDialogProps) {
  const t = useTranslations('Admin');
  const [formData, setFormData] = useState({
    name: '',
    audienceIds: [] as string[]
  });
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAudiences, setLoadingAudiences] = useState(false);

  useEffect(() => {
    if (isOpen && filter) {
      setFormData({
        name: filter.name,
        audienceIds: filter.audienceIds || []
      });
      fetchAudiences();
    }
  }, [isOpen, filter]);

  const fetchAudiences = async () => {
    try {
      setLoadingAudiences(true);
      const result = await getAudiences();
      if (result.success && result.audiences) {
        setAudiences(result.audiences as Audience[]);
      }
    } catch (err) {
      console.error('Error fetching audiences:', err);
    } finally {
      setLoadingAudiences(false);
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

  const handleAudienceIdsChange = (selectedIds: string[]) => {
    setFormData((prev) => ({
      ...prev,
      audienceIds: selectedIds
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (formData.audienceIds.length === 0) {
        throw new Error('Please select at least one audience');
      }

      const result = await updateFilter(filter.id, {
        name: formData.name,
        audienceIds: formData.audienceIds
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update filter');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating filter:', err);
      setError(err.message || 'Failed to update filter. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('filterManagement.editFilter') || 'Edit Filter'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('filterManagement.name') || 'Name'}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('filterManagement.namePlaceholder') || 'Enter filter name'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('filterManagement.audiences') || 'Audiences'}</Label>
            <AudienceMultiselect
              audiences={audiences}
              selectedIds={formData.audienceIds}
              onSelectionChange={handleAudienceIdsChange}
              placeholder={t('filterManagement.audiencesPlaceholder') || 'Select audiences...'}
              disabled={loadingAudiences}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || formData.audienceIds.length === 0}>
              {isSubmitting ? (t('filterManagement.updating') || 'Updating...') : (t('filterManagement.update') || 'Update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
