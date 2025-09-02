'use server';

// import { signIn } from '@/auth'; // Removed - using Firebase Auth
import { redirect } from '@/i18n/routing';
import ratelimit from '@/lib/ratelimit';
import { checkEmailExists, createUser } from '@/utils/database/queries/users';
import { hash } from 'bcryptjs';
import { getLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { generateVerificationCode } from './verification';

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, 'email' | 'password'>
) => {
  const { email, password } = params;

  const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    const locale = await getLocale();
    return redirect({ href: '/too-fast', locale });
  }

  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error: unknown) {
    if ((error as any).type !== 'CredentialsSignin') {
      console.error(error, 'Signin error');
    }

    return {
      success: false,
      error:
        'Invalid email or password. Please check your details and try again.'
    };
  }
};

export const signUp = async (params: AuthCredentials & { role?: string }) => {
  const { fullName, email, phone, password, role = 'user' } = params;
  const emailLower = email.toLowerCase();

  // Get client IP for rate limiting
  const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';
  const { success: rateLimitSuccess } = await ratelimit.limit(ip);

  if (!rateLimitSuccess) {
    const locale = await getLocale();
    return redirect({ href: '/too-fast', locale });
  }

  // Check if user already exists
  const existingUser = await checkEmailExists(emailLower);

  if (existingUser.length > 0) {
    return { success: false, error: 'User already exists' };
  }

  const hashedPassword = await hash(password, 10);

  try {
    // Insert new user into the database
    await createUser(fullName, email, phone, hashedPassword, role);

    // await workflowClient.trigger({
    //   url: `${process.env.NEXT_PUBLIC_PROD_API_ENDPOINT}/api/workflow/onboarding`,
    //   body: {
    //     email,
    //     fullName
    //   }
    // });

    // Generate a verification code and (optionally) send it by email.
    const verificationResult = await generateVerificationCode(emailLower);
    if (!verificationResult.success) {
      return { success: false, error: 'Failed to generate verification code' };
    }

    // Sign in the user (if desired) and return success.
    await signInWithCredentials({ email: emailLower, password });
    return { success: true };
  } catch (error: any) {
    console.log(error, 'Signup error');
    return { success: false, error: 'Signup error' };
  }
};
