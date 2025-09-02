import { auth } from '@/auth';
import ConfirmationPage from '@/components/auth/ConfirmationPage';
import { redirect } from '@/i18n/routing';
import { isEmailVerified } from '@/src/middleware/email-verification';
import { db } from '@/utils/database/drizzle';
import { VerificationCode } from '@/utils/database/schema';
import { and, desc, eq } from 'drizzle-orm';
import { getLocale } from 'next-intl/server';

const confirmationPage = async () => {
  const session = await auth();
  const locale = await getLocale();

  // Redirect if not authenticated
  if (!session || !session.user || !session.user.email) {
    return redirect({ href: '/auth/sign-in', locale });
  }

  // Check if there's a valid pending verification code for this user
  const pendingVerification = await db
    .select()
    .from(VerificationCode)
    .where(
      and(
        eq(VerificationCode.email, session.user.email),
        eq(VerificationCode.used, false)
      )
    )
    .orderBy(desc(VerificationCode.createdAt))
    .limit(1);

  // Check if user's email is already verified
  const userEmailVerified = await isEmailVerified(session.user.email);

  // If no pending verification code exists
  if (!pendingVerification.length) {
    // Only allow access for email verification if user is not verified
    if (userEmailVerified) {
      return redirect({ href: '/', locale });
    }
    return <ConfirmationPage verificationType="email_verification" />;
  }

  const verificationCode = pendingVerification[0];

  // For email verification, only allow access if user is not verified
  if (verificationCode.type === 'email_verification' && userEmailVerified) {
    return redirect({ href: '/', locale });
  }

  // For password_reset and email_change, allow access regardless of email verification status
  // Check if the verification code is expired
  if (new Date() > verificationCode.expires) {
    // Allow access with expired code so user can request a new one
    return <ConfirmationPage verificationType={verificationCode.type} />;
  }

  return <ConfirmationPage verificationType={verificationCode.type} />;
};

export default confirmationPage;
