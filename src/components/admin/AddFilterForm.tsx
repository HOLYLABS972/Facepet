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
import { AudienceMultiselect } from '@/components/ui/audience-multiselect';

import { createFilter, getAudiences } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Audience } from '@/types/promo';

export default function AddFilterForm() {
  const t = useTranslations('Admin');
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    audienceIds: [] as string[]
  });
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAudiences, setLoadingAudiences] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchAudiences();
    }
  }, [isOpen]);

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

      console.log('Submitting filter data:', formData);
      
      const result = await createFilter({
        name: formData.name,
        audienceIds: formData.audienceIds
      }, 'admin'); // TODO: Get actual user ID

      console.log('Create filter result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create filter');
      }

      // Reset form and close
      setFormData({
        name: '',
        audienceIds: []
      });
      setIsOpen(false);

      // Refresh the page to show the new filter
      window.location.reload();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Failed to create filter. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          {t('filterManagement.addNewFilter') || 'Add New Filter'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('filterManagement.addNewFilter') || 'Add New Filter'}</DialogTitle>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || formData.audienceIds.length === 0}>
              {isSubmitting ? (t('filterManagement.creating') || 'Creating...') : (t('filterManagement.createFilter') || 'Create Filter')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
