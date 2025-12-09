'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2 } from 'lucide-react';
import { getInstallBannerSettings, saveInstallBannerSettings, InstallBannerSettings } from '@/lib/actions/admin';
import MediaUpload from '@/components/admin/MediaUpload';
import toast from 'react-hot-toast';

interface InstallBannerSettingsFormProps {
  initialData?: InstallBannerSettings | null;
}

export default function InstallBannerSettingsForm({ initialData }: InstallBannerSettingsFormProps) {
  const router = useRouter();
  const t = useTranslations('Admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    enabled: false,
    bannerText: 'Add this website to your home screen for quick access!',
    logoUrl: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        enabled: initialData.enabled || false,
        bannerText: initialData.bannerText || 'Add this website to your home screen for quick access!',
        logoUrl: initialData.logoUrl || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      enabled: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await saveInstallBannerSettings({
        enabled: formData.enabled,
        bannerText: formData.bannerText,
        logoUrl: formData.logoUrl
      });

      if (result.success) {
        setSuccess(true);
        toast.success('Install banner settings saved successfully!');
        setTimeout(() => {
          setSuccess(false);
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || 'Failed to save install banner settings');
        toast.error(result.error || 'Failed to save install banner settings');
      }
    } catch (err) {
      setError('Failed to save install banner settings');
      toast.error('Failed to save install banner settings');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install Banner Settings</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Configure the banner that prompts users to add your website to their home screen on mobile devices.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
              Settings saved successfully!
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enable Install Banner</Label>
                <p className="text-sm text-gray-500">
                  Show the banner to mobile users prompting them to add the site to their home screen
                </p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={handleSwitchChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bannerText">Banner Text</Label>
              <Textarea
                id="bannerText"
                name="bannerText"
                value={formData.bannerText}
                onChange={handleChange}
                placeholder="Enter the text to display in the install banner..."
                rows={3}
                disabled={!formData.enabled}
              />
              <p className="text-xs text-gray-500">
                This text will be shown to users on mobile devices
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo (Optional)</Label>
              <MediaUpload
                type="image"
                value={formData.logoUrl}
                onChange={(filePath) => {
                  setFormData(prev => ({ ...prev, logoUrl: filePath }));
                }}
              />
              <p className="text-xs text-gray-500">
                Logo to display in the banner (recommended: 192x192px or 512x512px)
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
