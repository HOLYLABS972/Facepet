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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AdStatus, AdType, createAd } from '@/lib/actions/admin';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddAdForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'image' as 'image' | 'video',
    content: '',
    duration: 5,
    status: 'inactive' as 'active' | 'inactive' | 'scheduled',
    startDate: '',
    endDate: ''
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
      [name]: name === 'duration' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Format dates if scheduled
      let startDate = null;
      let endDate = null;

      if (formData.status === 'scheduled') {
        if (!formData.startDate || !formData.endDate) {
          throw new Error('Start and end dates are required for scheduled ads');
        }
        startDate = new Date(formData.startDate);
        endDate = new Date(formData.endDate);
      }

      await createAd({
        title: formData.title,
        type: formData.type,
        content: formData.content,
        duration: formData.duration,
        status: formData.status,
        startDate,
        endDate,
        createdBy: null // Will be set server-side based on current user
      });

      // Reset form and close
      setFormData({
        title: '',
        type: 'image',
        content: '',
        duration: 5,
        status: 'inactive',
        startDate: '',
        endDate: ''
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
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add New Ad
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Advertisement</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                name="type"
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value as AdType }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <MediaUpload
              type={formData.type}
              value={formData.content}
              onChange={(filePath) => {
                setFormData((prev) => ({ ...prev, content: filePath }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value as AdStatus
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === 'scheduled' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required={formData.status === 'scheduled'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  required={formData.status === 'scheduled'}
                />
              </div>
            </div>
          )}

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
