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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { updateBusiness, getAudiences } from '@/lib/actions/admin';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Business, Audience } from '@/types/promo';
import { HEBREW_SERVICE_TAGS } from '@/src/lib/constants/hebrew-service-tags';

interface EditBusinessDialogProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBusinessDialog({ business, isOpen, onClose, onSuccess }: EditBusinessDialogProps) {
  const t = useTranslations('Admin');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    contactInfo: {
      email: '',
      phone: '',
      address: ''
    },
    tags: [] as string[],
    audienceId: '',
    rating: ''
  });
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAudiences();
      if (business) {
        setFormData({
          name: business.name || '',
          description: business.description || '',
          imageUrl: business.imageUrl || '',
          contactInfo: {
            email: business.contactInfo?.email || '',
            phone: business.contactInfo?.phone || '',
            address: business.contactInfo?.address || ''
          },
          tags: business.tags || [],
          audienceId: business.audienceId || '',
          rating: business.rating?.toString() || ''
        });
      }
    }
  }, [isOpen, business]);

  const fetchAudiences = async () => {
    setLoading(true);
    try {
      const audiencesResult = await getAudiences();
      if (audiencesResult.success && audiencesResult.audiences) {
        setAudiences(audiencesResult.audiences as Audience[]);
      }
    } catch (err) {
      console.error('Error fetching audiences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contactInfo.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => {
      if (prev.tags.includes(tag)) {
        return {
          ...prev,
          tags: prev.tags.filter(t => t !== tag)
        };
      } else {
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateBusiness(business.id, {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        contactInfo: formData.contactInfo,
        tags: formData.tags,
        audienceId: formData.audienceId || undefined,
        rating: formData.rating ? Number(formData.rating) : undefined
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update business');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating business:', err);
      setError(err.message || 'Failed to update business. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Business</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('businessManagement.name')}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter business name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('businessManagement.description')}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter business description"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">{t('businessManagement.image')}</Label>
            <MediaUpload
              type="image"
              value={formData.imageUrl}
              onChange={(filePath) => {
                setFormData((prev) => ({ ...prev, imageUrl: filePath }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
              {HEBREW_SERVICE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`
                    text-left p-2 rounded text-sm transition-colors
                    ${formData.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 hover:bg-gray-200'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
            {formData.tags.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 mb-1">Selected tags ({formData.tags.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">{t('businessManagement.rating')}</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={formData.rating}
              onChange={handleChange}
              placeholder="Enter rating (1-5)"
            />
          </div>

          <div className="space-y-4">
            <Label>Contact Information</Label>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="contactInfo.email"
                type="email"
                value={formData.contactInfo.email}
                onChange={handleChange}
                placeholder="business@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="contactInfo.phone"
                value={formData.contactInfo.phone}
                onChange={handleChange}
                placeholder="+1-XXX-XXX-XXXX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="contactInfo.address"
                value={formData.contactInfo.address}
                onChange={handleChange}
                placeholder="Enter business address"
                rows={2}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audienceId">{t('businessManagement.audience')}</Label>
            <Select 
              value={formData.audienceId} 
              onValueChange={(value) => handleSelectChange('audienceId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('businessManagement.audiencePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  audiences.map((audience) => (
                    <SelectItem key={audience.id} value={audience.id}>
                      {audience.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Business'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
