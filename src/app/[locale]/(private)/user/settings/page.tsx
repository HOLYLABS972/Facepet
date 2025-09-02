import { auth } from '@/lib/auth-server';
import SettingsPage from '@/src/components/user/SettingsPage';
import { redirect } from '@/src/i18n/routing';
import { getUserDetailsByEmail } from '@/utils/database/queries/users';
import { getLocale } from 'next-intl/server';

const page = async () => {
  const locale = await getLocale();
  const session = await auth();

  if (!session || !session.user || !session.user.email) {
    redirect({ href: '/', locale });
    return;
  }

  const userDetails = await getUserDetailsByEmail(session?.user?.email);

  return <SettingsPage userDetails={userDetails} />;
};

export default page;
