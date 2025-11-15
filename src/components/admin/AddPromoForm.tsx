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

import { createPromo, getBusinesses, getAudiences } from '@/lib/actions/admin';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Business, Audience } from '@/types/promo';

export default function AddPromoForm() {
  const t = useTranslations('Admin');
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    businessId: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.businessId || !formData.audienceId || formData.businessId === 'loading' || formData.audienceId === 'loading') {
        throw new Error('Please select both business and audience');
      }

      const result = await createPromo({
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        businessId: formData.businessId,
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
        businessId: '',
        audienceId: '',
        startDate: '',
        endDate: ''
      });
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
        <Button className="flex items-center gap-2 rtl:flex-row-reverse">
          <PlusCircle className="h-4 w-4" />
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
            <Label htmlFor="imageUrl">{t('promoManagement.image')}</Label>
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
              <Label htmlFor="businessId">{t('promoManagement.business')}</Label>
              <Select 
                value={formData.businessId} 
                onValueChange={(value) => handleSelectChange('businessId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('promoManagement.businessPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : t('promoManagement.createPromo')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
