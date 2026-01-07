'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { saveCookieSettings, type CookieSettings } from '@/lib/actions/admin';
import { Loader2, Save, Cookie, Shield, BarChart3, Megaphone } from 'lucide-react';

interface CookieSettingsFormProps {
  initialData?: CookieSettings | null;
}

export default function CookieSettingsForm({ initialData }: CookieSettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    cookiesEnabled: true, // Always enabled by default
    analyticsEnabled: false,
    marketingEnabled: false,
    necessaryCookiesEnabled: true,
    cookieBannerText: 'We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.',
    cookiePolicyUrl: '/privacy'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        cookiesEnabled: true, // Always enabled
        analyticsEnabled: initialData.analyticsEnabled || false,
        marketingEnabled: initialData.marketingEnabled || false,
        necessaryCookiesEnabled: initialData.necessaryCookiesEnabled !== false,
        cookieBannerText: initialData.cookieBannerText || 'We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.',
        cookiePolicyUrl: initialData.cookiePolicyUrl || '/privacy'
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

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const cookieSettings = {
        cookiesEnabled: formData.cookiesEnabled,
        analyticsEnabled: formData.analyticsEnabled,
        marketingEnabled: formData.marketingEnabled,
        necessaryCookiesEnabled: formData.necessaryCookiesEnabled,
        cookieBannerText: formData.cookieBannerText,
        cookiePolicyUrl: formData.cookiePolicyUrl
      };

      const result = await saveCookieSettings(cookieSettings);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          // Avoid router.refresh() which causes POST to / on iOS memory issues
          // Just close the success message instead
        }, 2000);
      } else {
        setError(result.error || 'Failed to save cookie settings');
      }
    } catch (err) {
      setError('Failed to save cookie settings');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cookie className="h-5 w-5" />
          Cookie Settings
        </CardTitle>
        <CardDescription>
          Manage cookie preferences and privacy settings for your website
        </CardDescription>
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
              Cookie settings saved successfully!
            </div>
          )}

          {/* Main Cookie Toggle */}
          {/* Cookie Management - Removed Enable Cookies switch, cookies work by default */}
          
          {/* Cookie Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cookie Categories</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="necessaryCookiesEnabled" className="text-base font-medium">
                    Necessary Cookies
                  </Label>
                  <p className="text-sm text-gray-600">
                    Essential cookies required for the website to function properly
                  </p>
                </div>
                <Switch
                  id="necessaryCookiesEnabled"
                  checked={formData.necessaryCookiesEnabled}
                  onCheckedChange={(checked) => handleSwitchChange('necessaryCookiesEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="analyticsEnabled" className="text-base font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics Cookies
                  </Label>
                  <p className="text-sm text-gray-600">
                    Help us understand how visitors interact with our website
                  </p>
                </div>
                <Switch
                  id="analyticsEnabled"
                  checked={formData.analyticsEnabled}
                  onCheckedChange={(checked) => handleSwitchChange('analyticsEnabled', checked)}
                  disabled={!formData.cookiesEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="marketingEnabled" className="text-base font-medium flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Marketing Cookies
                  </Label>
                  <p className="text-sm text-gray-600">
                    Used to track visitors across websites for advertising purposes
                  </p>
                </div>
                <Switch
                  id="marketingEnabled"
                  checked={formData.marketingEnabled}
                  onCheckedChange={(checked) => handleSwitchChange('marketingEnabled', checked)}
                  disabled={!formData.cookiesEnabled}
                />
              </div>
            </div>
          </div>

          {/* Cookie Banner Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cookie Banner Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="cookieBannerText">Banner Text</Label>
              <Textarea
                id="cookieBannerText"
                name="cookieBannerText"
                value={formData.cookieBannerText}
                onChange={handleChange}
                placeholder="Enter the text to display in the cookie banner..."
                rows={3}
                disabled={!formData.cookiesEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cookiePolicyUrl">Cookie Policy URL</Label>
              <Input
                id="cookiePolicyUrl"
                name="cookiePolicyUrl"
                type="url"
                value={formData.cookiePolicyUrl}
                onChange={handleChange}
                placeholder="/privacy"
                disabled={!formData.cookiesEnabled}
              />
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
                  Save Cookie Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
