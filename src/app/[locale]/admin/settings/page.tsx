import ContactInfoForm from '@/components/admin/ContactInfoForm';
import { getContactInfo } from '@/lib/actions/admin';
import { getTranslations } from 'next-intl/server';

export default async function SettingsPage() {
  const t = await getTranslations('Admin');
  const contactInfo = await getContactInfo();

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('settingsManagement')}</h1>
        <p className="text-gray-600 mt-2">{t('manageSettingsDescription')}</p>
      </div>

      <div className="space-y-8 max-w-4xl">
        <ContactInfoForm initialData={contactInfo} />
      </div>
    </div>
  );
}
