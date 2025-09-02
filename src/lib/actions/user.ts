'use server';

// import { auth } from '@/auth'; // Removed - using Firebase Auth
import { redirect } from '@/src/i18n/routing';
import { db } from '@/utils/database/drizzle';
import { users } from '@/utils/database/schema';
import { hash } from 'bcryptjs';
import { and, eq, not } from 'drizzle-orm';
import { getLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import ratelimit from '../ratelimit';

export const updateProfile = async (params: {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
}) => {
  const { fullName, email, phone, password } = params;
  const emailLower = email.toLowerCase();
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Get client IP for rate limiting
  const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';
  const { success: rateLimitSuccess } = await ratelimit.limit(ip);

  if (!rateLimitSuccess) {
    const locale = await getLocale();
    return redirect({ href: '/too-fast', locale });
  }

  // Check if new email is already used by another user
  const existingUser = await db
    .select()
    .from(users)
    .where(and(eq(users.email, emailLower), not(eq(users.id, session.user.id))))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, error: 'Email already in use' };
  }

  let hashedPassword;
  if (password) {
    hashedPassword = await hash(password, 10);
  }

  try {
    await db
      .update(users)
      .set({
        fullName,
        email: emailLower,
        phone,
        ...(password ? { password: hashedPassword } : {})
      })
      .where(eq(users.id, session.user.id));

    return { success: true };
  } catch (error: any) {
    console.log(error, 'Update profile error');
    return { success: false, error: 'Profile update error' };
  }
};
