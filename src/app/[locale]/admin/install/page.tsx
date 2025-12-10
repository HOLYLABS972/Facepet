import InstallBannerPreview from '@/components/admin/InstallBannerPreview';
import InstallAutomationTools from '@/components/admin/InstallAutomationTools';
import InstallBannerSettingsForm from '@/components/admin/InstallBannerSettingsForm';
import { getInstallBannerSettings } from '@/lib/actions/admin';
import { getTranslations } from 'next-intl/server';

export default async function InstallPage() {
  const t = await getTranslations('Admin');
  const installBannerSettings = await getInstallBannerSettings();

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Install App / Add to Home Screen</h1>
        <p className="text-gray-600 mt-2">
          Configure and manage the install banner and automation tools for adding the website to shortcuts
        </p>
      </div>

      <div className="space-y-8 max-w-4xl">
        <InstallBannerSettingsForm initialData={installBannerSettings} />
        <InstallBannerPreview initialData={installBannerSettings} />
        <InstallAutomationTools />
      </div>
    </div>
  );
}
