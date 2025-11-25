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

import { updateAudience, deleteAudience } from '@/lib/actions/admin';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Audience } from '@/types/promo';

interface EditAudienceDialogProps {
  audience: Audience;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAudienceDialog({ audience, isOpen, onClose, onSuccess }: EditAudienceDialogProps) {
  const t = useTranslations('Admin');
  const [formData, setFormData] = useState({
    name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('EditAudienceDialog effect - isOpen:', isOpen, 'audience:', audience);
    if (isOpen && audience) {
      setFormData({
        name: audience.name
      });
    }
  }, [isOpen, audience]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
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
      const result = await updateAudience(audience.id, {
        name: formData.name,
        description: '',
        targetCriteria: []
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update audience');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating audience:', err);
      setError(err.message || 'Failed to update audience. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the audience "${audience.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteAudience(audience.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete audience');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting audience:', err);
      setError(err.message || 'Failed to delete audience. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  console.log('EditAudienceDialog render - isOpen:', isOpen);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('dialogs.editAudience.title')}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('audienceManagement.name')}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('dialogs.editAudience.enterAudienceName')}
              required
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </Button>
            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {isSubmitting ? t('dialogs.editAudience.updating') : t('dialogs.editAudience.update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
