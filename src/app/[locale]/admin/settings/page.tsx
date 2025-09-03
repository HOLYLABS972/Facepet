import ContactInfoForm from '@/components/admin/ContactInfoForm';
import { getContactInfo } from '@/lib/actions/admin';
import { getTranslations } from 'next-intl/server';

export default async function SettingsPage() {
  const t = await getTranslations('Admin');
  const contactInfo = await getContactInfo();

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your contact information and application settings</p>
      </div>

      <div className="max-w-2xl">
        <ContactInfoForm initialData={contactInfo} />
      </div>
    </div>
  );
}
