'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { saveContactInfo, type ContactInfo } from '@/lib/actions/admin';
import { Loader2, Save, Phone, Mail, MapPin, Settings, Smartphone, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ContactInfoFormProps {
  initialData?: ContactInfo | null;
}

export default function ContactInfoForm({ initialData }: ContactInfoFormProps) {
  const router = useRouter();
  const t = useTranslations('Admin.settings');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
    androidAppUrl: '',
    iosAppUrl: '',
    storeUrl: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        facebook: initialData.facebook || '',
        instagram: initialData.instagram || '',
        whatsapp: initialData.whatsapp || '',
        androidAppUrl: initialData.androidAppUrl || '',
        iosAppUrl: initialData.iosAppUrl || '',
        storeUrl: initialData.storeUrl || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const contactInfo = {
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        facebook: formData.facebook,
        instagram: formData.instagram,
        whatsapp: formData.whatsapp,
        androidAppUrl: formData.androidAppUrl,
        iosAppUrl: formData.iosAppUrl,
        storeUrl: formData.storeUrl
      };

      console.log('Saving contact info with mobile app links:', contactInfo);
      const result = await saveContactInfo(contactInfo);

      if (result.success) {
        console.log('Contact info saved successfully');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.refresh();
        }, 2000);
      } else {
        console.error('Failed to save contact info:', result.error);
        setError(result.error || 'Failed to save contact information');
      }
    } catch (err) {
      setError('Failed to save contact information');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description')}
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
              {t('saveSuccess')}
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t('contactInformation')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('emailAddress')} *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phoneNumber')} *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('phonePlaceholder')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('address')} *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t('addressPlaceholder')}
                required
              />
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t('socialMedia')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">{t('facebook')}</Label>
                <Input
                  id="facebook"
                  name="facebook"
                  type="url"
                  value={formData.facebook}
                  onChange={handleChange}
                  placeholder={t('facebookPlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instagram">{t('instagram')}</Label>
                <Input
                  id="instagram"
                  name="instagram"
                  type="url"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder={t('instagramPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">{t('whatsapp')}</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="url"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder={t('whatsappPlaceholder')}
              />
            </div>
          </div>

          {/* Mobile App Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {t('mobileAppLinks')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="androidAppUrl">{t('androidAppStoreUrl')}</Label>
                <Input
                  id="androidAppUrl"
                  name="androidAppUrl"
                  type="url"
                  value={formData.androidAppUrl}
                  onChange={handleChange}
                  placeholder={t('androidPlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="iosAppUrl">{t('iosAppStoreUrl')}</Label>
                <Input
                  id="iosAppUrl"
                  name="iosAppUrl"
                  type="url"
                  value={formData.iosAppUrl}
                  onChange={handleChange}
                  placeholder={t('iosPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Store Link */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              {t('storeLink')}
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="storeUrl">{t('storeUrl')}</Label>
              <Input
                id="storeUrl"
                name="storeUrl"
                type="url"
                value={formData.storeUrl}
                onChange={handleChange}
                placeholder={t('storePlaceholder')}
              />
              <p className="text-sm text-gray-600">
                {t('storeDescription')}
              </p>
            </div>
          </div>

          {/* Cookie Notice Setting - Removed, cookies work by default without notice */}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('saveChanges')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
