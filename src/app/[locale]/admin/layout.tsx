import AdminLayout from '@/components/admin/AdminLayout';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function AdminLayoutWrapper({
  children
}: {
  children: React.ReactNode;
}) {
  // Force English locale for admin panel
  const messages = await getMessages({ locale: 'en' });
  
  return (
    <NextIntlClientProvider messages={messages} locale="en">
      <AdminLayout>{children}</AdminLayout>
    </NextIntlClientProvider>
  );
}
