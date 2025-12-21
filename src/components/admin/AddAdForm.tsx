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
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { HEBREW_SERVICE_TAGS } from '@/src/lib/constants/hebrew-service-tags';
import { getPetTypesForDropdown, getBreedsForDropdown, getAreasForDropdown, getCitiesForDropdown, getAgeRangesForDropdown, getWeightRangesForDropdown } from '@/lib/firebase/dropdown-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddAdForm() {
  const t = useTranslations('Admin');
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale() as 'en' | 'he';
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    phone: '',
    location: '',
    description: '',
    tags: [] as string[],
    area: '',
    city: '',
    petType: '',
    breed: '',
    ageRange: '',
    weight: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [petTypes, setPetTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [breeds, setBreeds] = useState<Array<{ value: string; label: string }>>([]);
  const [areas, setAreas] = useState<Array<{ value: string; label: string }>>([]);
  const [cities, setCities] = useState<Array<{ value: string; label: string }>>([]);
  const [ageRanges, setAgeRanges] = useState<Array<{ value: string; label: string }>>([]);
  const [weightRanges, setWeightRanges] = useState<Array<{ value: string; label: string }>>([]);

  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      loadPetTypes();
      loadAreas();
      loadCities();
      loadAgeRanges();
      loadWeightRanges();
    }
  }, [isOpen, locale]);

  useEffect(() => {
    if (formData.petType) {
      loadBreeds(formData.petType);
    } else {
      setBreeds([]);
    }
  }, [formData.petType]);

  const loadPetTypes = async () => {
    const types = await getPetTypesForDropdown(locale);
    setPetTypes(types);
  };

  const loadBreeds = async (petType: string) => {
    const breedList = await getBreedsForDropdown(petType, locale);
    setBreeds(breedList);
  };

  const loadAreas = async () => {
    const areaList = await getAreasForDropdown(locale);
    setAreas(areaList);
  };

  const loadCities = async () => {
    const cityList = await getCitiesForDropdown(locale);
    setCities(cityList);
  };

  const loadAgeRanges = async () => {
    const ageRangeList = await getAgeRangesForDropdown(locale);
    setAgeRanges(ageRangeList);
  };

  const loadWeightRanges = async () => {
    const weightRangeList = await getWeightRangesForDropdown(locale);
    setWeightRanges(weightRangeList);
  };

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
        tags: formData.tags,
        area: formData.area,
        city: formData.city,
        petType: formData.petType,
        breed: formData.breed,
        ageRange: formData.ageRange,
        weight: formData.weight
      });

      // Reset form and close
      setFormData({
        title: '',
        content: '',
        phone: '',
        location: '',
        description: '',
        tags: [],
        area: '',
        city: '',
        petType: '',
        breed: '',
        ageRange: '',
        weight: ''
      });
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
        <Button>
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
            <Label htmlFor="title">{t('forms.addAd.title')}</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>



          <div className="space-y-2">
            <Label htmlFor="content">{t('forms.addAd.content')}</Label>
            <MediaUpload
              type="image"
              value={formData.content}
              onChange={(filePath) => {
                setFormData((prev) => ({ ...prev, content: filePath }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('forms.addAd.description')}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('forms.addAd.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('forms.addAd.phoneNumber')}</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('forms.addAd.phonePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t('forms.addAd.location')}</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder={t('forms.addAd.locationPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">{t('forms.addAd.area')}</Label>
              <Select value={formData.area} onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, area: value }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.addAd.areaPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t('forms.addAd.city')}</Label>
              <Select value={formData.city} onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, city: value }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.addAd.cityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="petType">{t('forms.addAd.petType')}</Label>
              <Select value={formData.petType} onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, petType: value, breed: '' }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.addAd.petTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {petTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">{t('forms.addAd.breed')}</Label>
              <Select 
                value={formData.breed} 
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, breed: value }));
                }}
                disabled={!formData.petType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.addAd.breedPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {breeds.map((breed) => (
                    <SelectItem key={breed.value} value={breed.value}>
                      {breed.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ageRange">{t('forms.addAd.ageRange')}</Label>
              <Select value={formData.ageRange} onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, ageRange: value }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.addAd.ageRangePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {ageRanges.map((ageRange) => (
                    <SelectItem key={ageRange.value} value={ageRange.value}>
                      {ageRange.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">{t('forms.addAd.weight')}</Label>
              <Select value={formData.weight} onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, weight: value }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.addAd.weightPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {weightRanges.map((weightRange) => (
                    <SelectItem key={weightRange.value} value={weightRange.value}>
                      {weightRange.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t('adActions.tags')}</Label>
            
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
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('forms.addAd.creating') : t('forms.addAd.createAd')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
