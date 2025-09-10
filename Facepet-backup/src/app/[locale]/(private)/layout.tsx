import { auth } from '@/auth';
import Navbar from '@/src/components/layout/Navbar';
import { redirect } from '@/src/i18n/routing';
import {
  isUserActiveToday,
  updateUserLastActivityDate
} from '@/utils/database/queries/users';
import { getLocale } from 'next-intl/server';
import { after } from 'next/server';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = async ({ children }: LayoutProps) => {
  const session = await auth();
  const locale = await getLocale();

  if (!session) redirect({ href: '/auth/sign-in', locale });

  after(async () => {
    if (!session?.user?.id) return;

    // get the user and see if the last activity day is today
    const userActiveTodayCheck = await isUserActiveToday(session.user.id);
    if (userActiveTodayCheck) return;

    await updateUserLastActivityDate(session.user.id);
  });

  return (
    <>
      <Navbar />
      <div className="flex grow flex-col p-4">{children}</div>
    </>
  );
};

export default Layout;
