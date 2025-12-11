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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { BusinessMultiselect } from '@/components/ui/business-multiselect';

import { createPromo, getBusinesses, getAudiences } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Business, Audience } from '@/types/promo';
import { getYouTubeEmbedUrl } from '@/lib/utils/youtube';

export default function AddPromoForm() {
  const t = useTranslations('Admin');
  const commonT = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'youtube'>('image');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    youtubeUrl: '',
    businessIds: [] as string[],
    audienceId: '',
    startDate: '',
    endDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [businessesResult, audiencesResult] = await Promise.all([
        getBusinesses(),
        getAudiences()
      ]);

      if (businessesResult.success) {
        setBusinesses(businessesResult.businesses);
      }
      if (audiencesResult.success) {
        setAudiences(audiencesResult.audiences);
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
      if (!formData.audienceId || formData.audienceId === 'loading') {
        throw new Error('Please select an audience');
      }

      const result = await createPromo({
        name: formData.name,
        description: formData.description,
        imageUrl: mediaType === 'image' ? formData.imageUrl : '',
        youtubeUrl: mediaType === 'youtube' ? formData.youtubeUrl : '',
        businessIds: formData.businessIds.length > 0 ? formData.businessIds : undefined,
        audienceId: formData.audienceId,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined
      }, 'admin'); // TODO: Get actual user ID

      if (!result.success) {
        throw new Error(result.error || 'Failed to create promo');
      }

      // Reset form and close
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        youtubeUrl: '',
        businessIds: [],
        audienceId: '',
        startDate: '',
        endDate: ''
      });
      setMediaType('image');
      setIsOpen(false);

      // Refresh the page to show the new promo
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create promo. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          {t('promoManagement.addNewPromo')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('promoManagement.addNewPromo')}</DialogTitle>
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
            <Label>{t('promoManagement.mediaTypeLabel')}</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="image"
                  checked={mediaType === 'image'}
                  onChange={(e) => setMediaType(e.target.value as 'image' | 'youtube')}
                  className="cursor-pointer"
                />
                <span>{t('promoManagement.mediaTypes.image')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="youtube"
                  checked={mediaType === 'youtube'}
                  onChange={(e) => setMediaType(e.target.value as 'image' | 'youtube')}
                  className="cursor-pointer"
                />
                <span>{t('promoManagement.mediaTypes.youtube')}</span>
              </label>
            </div>
          </div>

          {mediaType === 'image' ? (
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
          ) : (
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">{t('promoManagement.youtubeUrlLabel')}</Label>
              <Input
                id="youtubeUrl"
                name="youtubeUrl"
                value={formData.youtubeUrl}
                onChange={handleChange}
                placeholder={t('promoManagement.youtubeUrlPlaceholder')}
                type="url"
                required={mediaType === 'youtube'}
              />
              <p className="text-sm text-gray-500">
                {t('promoManagement.youtubeUrlHelp')}
              </p>
              {formData.youtubeUrl && getYouTubeEmbedUrl(formData.youtubeUrl) && (
                <div className="mt-4 rounded-md overflow-hidden border w-1/5">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={getYouTubeEmbedUrl(formData.youtubeUrl) || ''}
                      title={t('promoManagement.youtubePreviewTitle')}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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

          <div className="space-y-2">
            <Label htmlFor="audienceId">{t('promoManagement.audience')}</Label>
            <Select 
              value={formData.audienceId} 
              onValueChange={(value) => handleSelectChange('audienceId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('promoManagement.audiencePlaceholder')} />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {commonT('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('promoManagement.creating') : t('promoManagement.createPromo')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
