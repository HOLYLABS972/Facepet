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
import { Textarea } from '@/components/ui/textarea';

import { updateAudience } from '@/lib/actions/admin';
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
    name: '',
    description: '',
    targetCriteria: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCriteria, setNewCriteria] = useState('');

  useEffect(() => {
    console.log('EditAudienceDialog effect - isOpen:', isOpen, 'audience:', audience);
    if (isOpen && audience) {
      setFormData({
        name: audience.name,
        description: audience.description,
        targetCriteria: audience.targetCriteria || []
      });
    }
  }, [isOpen, audience]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const addCriteria = () => {
    if (newCriteria.trim() && !formData.targetCriteria.includes(newCriteria.trim())) {
      setFormData((prev) => ({
        ...prev,
        targetCriteria: [...prev.targetCriteria, newCriteria.trim()]
      }));
      setNewCriteria('');
    }
  };

  const removeCriteria = (criteriaToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      targetCriteria: prev.targetCriteria.filter(criteria => criteria !== criteriaToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateAudience(audience.id, {
        name: formData.name,
        description: formData.description,
        targetCriteria: formData.targetCriteria
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

          <div className="space-y-2">
            <Label htmlFor="description">{t('audienceManagement.description')}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('dialogs.editAudience.enterAudienceDescription')}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCriteria">{t('dialogs.editAudience.targetCriteria')}</Label>
            <div className="flex gap-2">
              <Input
                id="targetCriteria"
                value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                placeholder={t('dialogs.editAudience.addCriteriaPlaceholder')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCriteria();
                  }
                }}
              />
              <Button type="button" onClick={addCriteria} variant="outline">
                {t('dialogs.editAudience.addCriteria')}
              </Button>
            </div>
            
            {formData.targetCriteria.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.targetCriteria.map((criteria, index) => (
                  <span
                    key={index}
                    className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm flex items-center gap-1"
                  >
                    {criteria}
                    <button
                      type="button"
                      onClick={() => removeCriteria(criteria)}
                      className="ml-1 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('dialogs.editAudience.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('dialogs.editAudience.updating') : t('dialogs.editAudience.update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
