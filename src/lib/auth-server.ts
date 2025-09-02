'use server';

import { db } from '@/utils/database/drizzle';
import { users } from '@/utils/database/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export interface ServerSession {
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    fullName: string;
    emailVerified: boolean;
  };
}

/**
 * Get the current user session from cookies
 * This function gets user info from our database based on email from cookies
 */
export async function auth(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    
    if (!userEmail) {
      return null;
    }

    // Get user details from our database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!userRecord.length) {
      return null;
    }

    const user = userRecord[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        emailVerified: user.emailVerified
      }
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Check if user has admin privileges
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return !!(session?.user?.role === 'admin' || session?.user?.role === 'super_admin');
}

/**
 * Check if user has super admin privileges
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth();
  return !!(session?.user?.role === 'super_admin');
}
