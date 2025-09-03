'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { saveContactInfo, type ContactInfo } from '@/lib/actions/admin';
import { Loader2, Save, Phone, Mail, MapPin, Settings } from 'lucide-react';

interface ContactInfoFormProps {
  initialData?: ContactInfo | null;
}

export default function ContactInfoForm({ initialData }: ContactInfoFormProps) {
  const router = useRouter();
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
    isEnabled: false
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
        isEnabled: initialData.isEnabled || false
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

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isEnabled: checked
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
        isEnabled: formData.isEnabled
      };

      const result = await saveContactInfo(contactInfo);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.refresh();
        }, 2000);
      } else {
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
          Settings
        </CardTitle>
        <CardDescription>
          Manage your contact information and application settings
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
              Contact information saved successfully!
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street, City, State, ZIP Code"
                required
              />
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Social Media
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  name="facebook"
                  type="url"
                  value={formData.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  name="instagram"
                  type="url"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourpage"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="url"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="https://wa.me/1234567890"
              />
            </div>
          </div>

          {/* Cookie Notice Setting */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Cookie Notice
            </h3>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="isEnabled" className="text-base font-medium">
                  Show Cookie Notice
                </Label>
                <p className="text-sm text-gray-600">
                  Display cookie consent banner to website visitors
                </p>
              </div>
              <Switch
                id="isEnabled"
                checked={formData.isEnabled}
                onCheckedChange={handleSwitchChange}
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
                  Save Contact Information
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
