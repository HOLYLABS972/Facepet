'use client';

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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sendUserInvitationByAdmin } from '@/lib/firebase/admin-client';

export default function AddUserForm() {
  const t = useTranslations('Admin');
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'user' as 'user' | 'admin' | 'super_admin'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await sendUserInvitationByAdmin(
        formData.fullName,
        formData.email,
        formData.phone,
        formData.role
      );

      if (!result.success) {
        setError(result.error || t('forms.addUser.error'));
        setIsSubmitting(false);
        return;
      }

      // Reset form and close
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        role: 'user'
      });
      setIsOpen(false);

      // Show success message
      if (result.warning) {
        console.log('⚠️', result.warning);
        setSuccessMessage(`Invitation email sent to admin fallback email. ${result.warning}`);
      } else {
        console.log('✅ Invitation email sent to:', formData.email);
        setSuccessMessage(`Invitation email sent successfully to ${formData.email}!`);
      }

      // Refresh the page
      router.refresh();
    } catch (err: any) {
      // Handle unexpected errors
      console.error('Unexpected error in form submission:', err);
      const errorMessage = err?.message || err?.errorInfo?.message || t('forms.addUser.error');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          {t('navigation.addUser')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('forms.addUser.title')}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('forms.addUser.fullName')}</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('forms.addUser.email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('forms.addUser.phone')}</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t('forms.addUser.role')}</Label>
            <Select
              name="role"
              value={formData.role}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  role: value as 'user' | 'admin' | 'super_admin'
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('forms.addUser.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t('usersManagement.roles.user')}</SelectItem>
                <SelectItem value="admin">{t('usersManagement.roles.admin')}</SelectItem>
                <SelectItem value="super_admin">{t('usersManagement.roles.super_admin')}</SelectItem>
              </SelectContent>
            </Select>
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
              {isSubmitting ? t('forms.addUser.creating') : t('forms.addUser.createUser')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
