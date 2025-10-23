'use client';

import MediaUpload from '@/components/admin/MediaUpload';
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

import { createAd } from '@/lib/actions/admin';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { HEBREW_SERVICE_TAGS } from '@/src/lib/constants/hebrew-service-tags';

export default function AddAdForm() {
  const t = useTranslations('Admin');
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    phone: '',
    location: '',
    description: '',
    tags: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };


  const addPredefinedTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createAd({
        title: formData.title,
        type: 'image', // Default to image
        content: formData.content,
        duration: 5, // Default duration
        status: 'active', // Default to active
        startDate: null,
        endDate: null,
        createdBy: null, // Will be set server-side based on current user
        phone: formData.phone,
        location: formData.location,
        description: formData.description,
        tags: formData.tags
      });

      // Reset form and close
      setFormData({
        title: '',
        content: '',
        phone: '',
        location: '',
        description: '',
        tags: []
      });
      setTagInput('');
      setIsOpen(false);

      // Refresh the page to show the new ad
      router.refresh();
    } catch (err: any) {
      setError(
        err.message || 'Failed to create advertisement. Please try again.'
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          {t('adsManagement.addNewAd')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('adsManagement.addNewAdvertisement')}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>



          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <MediaUpload
              type="image"
              value={formData.content}
              onChange={(filePath) => {
                setFormData((prev) => ({ ...prev, content: filePath }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter service description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+972-XX-XXX-XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            
            {/* Predefined Hebrew Service Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">{tCommon('serviceTags')}</Label>
              <div className="flex flex-wrap gap-2">
                {HEBREW_SERVICE_TAGS.map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addPredefinedTag(tag)}
                    disabled={formData.tags.includes(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            
            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">{tCommon('selectedTags')}</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>



          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Ad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
