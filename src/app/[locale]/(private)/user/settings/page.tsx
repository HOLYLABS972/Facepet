// import { auth } from '@/auth'; // Removed - using Firebase Auth
import SettingsPage from '@/src/components/user/SettingsPage';
import { redirect } from '@/src/i18n/routing';
import { getUserDetails } from '@/utils/database/queries/users';
import { getLocale } from 'next-intl/server';

const page = async () => {
  const locale = await getLocale();
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect({ href: '/', locale });
    return;
  }

  const userDetails = await getUserDetails(session?.user?.id);

  return <SettingsPage userDetails={userDetails} />;
};

export default page;
