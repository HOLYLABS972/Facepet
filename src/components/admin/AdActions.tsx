'use client';

import MediaUpload from '@/components/admin/MediaUpload';
import { Button } from '@/components/ui/button';
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
import { AdStatus, AdType, deleteAd, updateAd } from '@/lib/actions/admin';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { HEBREW_SERVICE_TAGS } from '@/src/lib/constants/hebrew-service-tags';

interface Ad {
  id: string;
  title: string;
  type: AdType;
  content: string;
  duration: number;
  status: AdStatus;
  startDate?: Date | null;
  endDate?: Date | null;
}

export default function AdActions({ ad }: { ad: Ad }) {
  const t = useTranslations('Admin');
  const tCommon = useTranslations('common');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: ad.title,
    content: ad.content,
    type: 'image' as AdType, // Always set to image
    startDate: ad.startDate
      ? new Date(ad.startDate).toISOString().split('T')[0]
      : '',
    endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
    phone: ad.phone || '',
    location: ad.location || '',
    description: ad.description || '',
    tags: ad.tags || []
  });

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


  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updateAd(ad.id, {
        title: formData.title,
        content: formData.content,
        type: 'image' as AdType, // Always set to image
        status: 'active' as AdStatus, // Always set to active
        startDate: null,
        endDate: null,
        phone: formData.phone,
        location: formData.location,
        description: formData.description,
        tags: formData.tags
      });

      setIsEditOpen(false);
      router.refresh();
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
      await deleteAd(ad.id);
      setIsDeleting(false);
      router.refresh();
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
            setFormData({
              title: ad.title,
              content: ad.content,
              type: 'image' as AdType, // Always set to image
              startDate: ad.startDate
                ? new Date(ad.startDate).toISOString().split('T')[0]
                : '',
              endDate: ad.endDate
                ? new Date(ad.endDate).toISOString().split('T')[0]
                : '',
              phone: ad.phone || '',
              location: ad.location || '',
              description: ad.description || '',
              tags: ad.tags || []
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
              <Label htmlFor="content">{t('adActions.content')}</Label>
              <MediaUpload
                type={formData.type}
                value={formData.content}
                onChange={(filePath) => {
                  setFormData((prev) => ({ ...prev, content: filePath }));
                }}
              />
            </div>



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
