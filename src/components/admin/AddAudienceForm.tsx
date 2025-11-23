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

import { createAudience } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function AddAudienceForm() {
  const t = useTranslations('Admin');
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetCriteria: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCriteria, setNewCriteria] = useState('');

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
      console.log('Submitting audience data:', formData);
      
      const result = await createAudience({
        name: formData.name,
        description: formData.description,
        targetCriteria: formData.targetCriteria
      }, 'admin'); // TODO: Get actual user ID

      console.log('Create audience result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create audience');
      }

      // Reset form and close
      setFormData({
        name: '',
        description: '',
        targetCriteria: []
      });
      setNewCriteria('');
      setIsOpen(false);

      // Refresh the page to show the new audience
      window.location.reload();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Failed to create audience. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          {t('audienceManagement.addNewAudience')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('audienceManagement.addNewAudience')}</DialogTitle>
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
              placeholder={t('audienceManagement.namePlaceholder')}
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
              placeholder={t('audienceManagement.descriptionPlaceholder')}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCriteria">{t('audienceManagement.targetCriteria')}</Label>
            <div className="flex gap-2">
              <Input
                id="targetCriteria"
                value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                placeholder={t('audienceManagement.targetCriteriaPlaceholder')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCriteria();
                  }
                }}
              />
              <Button type="button" onClick={addCriteria} variant="outline">
                {t('audienceManagement.add')}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('audienceManagement.creating') : t('audienceManagement.createAudience')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
