'use client';

import MediaUpload from '@/components/admin/MediaUpload';
import { Button } from '@/components/ui/button';
import { getYouTubeEmbedUrl, getYouTubeVideoId } from '@/lib/utils/youtube';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { AdStatus, AdType, deleteAd, updateAd, Ad } from '@/lib/actions/admin';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { HEBREW_SERVICE_TAGS } from '@/src/lib/constants/hebrew-service-tags';
import { getPetTypesForDropdown, getBreedsForDropdown, getAreasForDropdown, getCitiesForDropdown, getAgeRangesForDropdown, getWeightRangesForDropdown } from '@/lib/firebase/dropdown-data';
import { SimpleMultiselect } from '@/components/ui/simple-multiselect';

interface AdActionsProps {
  ad: Ad;
  onDelete?: () => void;
  onUpdate?: () => void;
}

export default function AdActions({ ad, onDelete, onUpdate }: AdActionsProps) {
  const t = useTranslations('Admin');
  const tCommon = useTranslations('common');
  const locale = useLocale() as 'en' | 'he';
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [petTypes, setPetTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [breeds, setBreeds] = useState<Array<{ value: string; label: string }>>([]);
  const [areas, setAreas] = useState<Array<{ value: string; label: string }>>([]);
  const [cities, setCities] = useState<Array<{ value: string; label: string }>>([]);
  const [ageRanges, setAgeRanges] = useState<Array<{ value: string; label: string }>>([]);
  const [weightRanges, setWeightRanges] = useState<Array<{ value: string; label: string }>>([]);

  // Detect if content is a YouTube URL
  const isYouTubeUrl = (url: string) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be') || getYouTubeVideoId(url) !== null;
  };

  const [mediaType, setMediaType] = useState<'image' | 'video' | 'youtube'>(() => {
    if (isYouTubeUrl(ad.content)) return 'youtube';
    return ad.type === 'video' ? 'video' : 'image';
  });

  const [formData, setFormData] = useState({
    title: ad.title,
    content: isYouTubeUrl(ad.content) ? '' : ad.content,
    youtubeUrl: isYouTubeUrl(ad.content) ? ad.content : '',
    type: ad.type,
    startDate: ad.startDate
      ? new Date(ad.startDate).toISOString().split('T')[0]
      : '',
    endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
    phone: ad.phone || '',
    location: ad.location || '',
    description: ad.description || '',
    tags: ad.tags || [],
    area: ad.area || '',
    city: ad.city || [],
    petType: ad.petType || '',
    breed: ad.breed || '',
    ageRange: ad.ageRange || [],
    weight: ad.weight || []
  });

  const router = useRouter();

  useEffect(() => {
    if (isEditOpen) {
      loadPetTypes();
    }
  }, [isEditOpen]);

  useEffect(() => {
    if (formData.petType) {
      loadBreeds(formData.petType);
    } else {
      setBreeds([]);
    }
  }, [formData.petType]);

  useEffect(() => {
    if (isEditOpen && ad) {
      const isYouTube = isYouTubeUrl(ad.content);
      setMediaType(isYouTube ? 'youtube' : (ad.type === 'video' ? 'video' : 'image'));
      setFormData({
        title: ad.title,
        content: isYouTube ? '' : ad.content,
        youtubeUrl: isYouTube ? ad.content : '',
        type: ad.type,
        startDate: ad.startDate
          ? new Date(ad.startDate).toISOString().split('T')[0]
          : '',
        endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
        phone: ad.phone || '',
        location: ad.location || '',
        description: ad.description || '',
        tags: ad.tags || [],
        area: ad.area || '',
        city: ad.city || [],
        petType: ad.petType || '',
        breed: ad.breed || '',
        ageRange: ad.ageRange || [],
        weight: ad.weight || []
      });
    }
  }, [isEditOpen, ad]);

  const loadPetTypes = async () => {
    const types = await getPetTypesForDropdown(locale);
    setPetTypes(types);
  };

  const loadBreeds = async (petType: string) => {
    const breedList = await getBreedsForDropdown(petType, locale);
    setBreeds(breedList);
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


  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Determine ad type and content based on media type
      let adType: 'image' | 'video' = 'image';
      let adContent = formData.content;
      
      if (mediaType === 'youtube') {
        // For YouTube, store the YouTube URL in content and set type to video
        adType = 'video';
        adContent = formData.youtubeUrl || '';
      } else if (mediaType === 'video') {
        adType = 'video';
        adContent = formData.content;
      } else {
        adType = 'image';
        adContent = formData.content;
      }

      await updateAd(ad.id, {
        title: formData.title,
        content: adContent,
        type: adType,
        status: 'active' as AdStatus, // Always set to active
        startDate: null,
        endDate: null,
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

      setIsEditOpen(false);
      if (onUpdate) {
        onUpdate();
      } else {
      router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update advertisement');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) {
      setIsDeleting(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteAd(ad.id);
      if (result.success) {
      setIsDeleting(false);
        if (onDelete) {
          onDelete();
        } else {
      router.refresh();
        }
      } else {
        setError(result.error || 'Failed to delete advertisement');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete advertisement');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t('adActions.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('adActions.actions')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            {t('adActions.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleting(true)}
            className="text-red-600 hover:text-red-700 focus:text-red-700"
          >
            {t('adActions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Ad Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Reset form data when closing
            const isYouTube = isYouTubeUrl(ad.content);
            setMediaType(isYouTube ? 'youtube' : (ad.type === 'video' ? 'video' : 'image'));
            setFormData({
              title: ad.title,
              content: isYouTube ? '' : ad.content,
              youtubeUrl: isYouTube ? ad.content : '',
              type: ad.type,
              startDate: ad.startDate
                ? new Date(ad.startDate).toISOString().split('T')[0]
                : '',
              endDate: ad.endDate
                ? new Date(ad.endDate).toISOString().split('T')[0]
                : '',
              phone: ad.phone || '',
              location: ad.location || '',
              description: ad.description || '',
              tags: ad.tags || [],
              area: ad.area || '',
              city: ad.city || [],
              petType: ad.petType || '',
              breed: ad.breed || '',
              ageRange: ad.ageRange || [],
              weight: ad.weight || []
            });
            setError(null);
          }
          setIsEditOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('adActions.edit')}</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('adActions.title')}</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('adActions.description')}</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('adActions.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('adActions.phoneNumber')}</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('adActions.phonePlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">{t('adActions.location')}</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={t('adActions.locationPlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">{t('adActions.area')}</Label>
                <Select value={formData.area} onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, area: value }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('adActions.areaPlaceholder')} />
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
                <Label htmlFor="city">{t('adActions.city')}</Label>
                <Select value={formData.city} onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, city: value }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('adActions.cityPlaceholder')} />
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
                <Label htmlFor="petType">{t('adActions.petType')}</Label>
                <Select value={formData.petType} onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, petType: value, breed: '' }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('adActions.petTypePlaceholder')} />
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
                <Label htmlFor="breed">{t('adActions.breed')}</Label>
                <Select 
                  value={formData.breed} 
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, breed: value }));
                  }}
                  disabled={!formData.petType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('adActions.breedPlaceholder')} />
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
                <Label htmlFor="ageRange">{t('adActions.ageRange')}</Label>
                <SimpleMultiselect
                  options={ageRanges}
                  selectedValues={formData.ageRange}
                  onSelectionChange={(values) => {
                    setFormData((prev) => ({ ...prev, ageRange: values }));
                  }}
                  placeholder={t('adActions.ageRangePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">{t('adActions.weight')}</Label>
                <SimpleMultiselect
                  options={weightRanges}
                  selectedValues={formData.weight}
                  onSelectionChange={(values) => {
                    setFormData((prev) => ({ ...prev, weight: values }));
                  }}
                  placeholder={t('adActions.weightPlaceholder')}
                />
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
                      <span key={index} className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-300">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('adActions.mediaType') || 'Media Type'}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="image"
                    checked={mediaType === 'image'}
                    onChange={(e) => setMediaType(e.target.value as 'image' | 'video' | 'youtube')}
                    className="cursor-pointer"
                  />
                  <span>{t('adActions.image') || 'Image'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="video"
                    checked={mediaType === 'video'}
                    onChange={(e) => setMediaType(e.target.value as 'image' | 'video' | 'youtube')}
                    className="cursor-pointer"
                  />
                  <span>{t('adActions.video') || 'Video'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="youtube"
                    checked={mediaType === 'youtube'}
                    onChange={(e) => setMediaType(e.target.value as 'image' | 'video' | 'youtube')}
                    className="cursor-pointer"
                  />
                  <span>{t('adActions.youtube') || 'YouTube'}</span>
                </label>
              </div>
            </div>

            {mediaType === 'youtube' ? (
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">{t('adActions.youtubeUrl') || 'YouTube URL'}</Label>
                <Input
                  id="youtubeUrl"
                  name="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  type="url"
                  required
                />
                <p className="text-sm text-gray-500">
                  {t('adActions.youtubeUrlHelp') || 'Enter a YouTube video URL'}
                </p>
                {formData.youtubeUrl && getYouTubeEmbedUrl(formData.youtubeUrl) && (
                  <div className="mt-4 rounded-md overflow-hidden border">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={getYouTubeEmbedUrl(formData.youtubeUrl) || ''}
                        title="YouTube video preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
            <div className="space-y-2">
              <Label htmlFor="content">{t('adActions.content')}</Label>
              <MediaUpload
                  type={mediaType}
                value={formData.content}
                onChange={(filePath) => {
                  setFormData((prev) => ({ ...prev, content: filePath }));
                }}
              />
            </div>
            )}



            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                {t('adActions.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('adActions.updating') : t('adActions.updateAd')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmation(false);
            setError(null);
          }
          setIsDeleting(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adActions.confirmDeletion')}</DialogTitle>
            <DialogDescription>
              {t('adActions.deleteMessage')}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              {t('adActions.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteConfirmation(true);
                handleDelete();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('adActions.deleting') : t('adActions.deleteAd')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
