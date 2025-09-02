'use server';

import { cookies } from 'next/headers';

export interface ServerSession {
  user: {
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    fullName: string;
    emailVerified: boolean;
    isRestricted: boolean;
  };
}

// In-memory user management (you can replace this with your preferred storage)
const userRoles: Record<string, 'user' | 'admin' | 'super_admin'> = {
  // Add admin emails here
  'admin@facepet.com': 'super_admin',
  // Add more admin emails as needed
};

const userRestrictions: Record<string, boolean> = {
  // Add restricted user emails here
  // 'banned@example.com': true,
};

const userProfiles: Record<string, { fullName: string; emailVerified: boolean }> = {
  // User profiles will be populated from Firebase Auth
};

/**
 * Get the current user session from cookies
 * This function gets user info from Firebase Auth and our role management
 */
export async function auth(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    const userFullName = cookieStore.get('user_fullname')?.value;
    const userEmailVerified = cookieStore.get('user_email_verified')?.value === 'true';
    
    if (!userEmail) {
      return null;
    }

    // Check if user is restricted
    const isRestricted = userRestrictions[userEmail] || false;
    
    // Get user role (default to 'user' if not specified)
    const role = userRoles[userEmail] || 'user';

    return {
      user: {
        email: userEmail,
        role,
        fullName: userFullName || 'User',
        emailVerified: userEmailVerified,
        isRestricted
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

/**
 * Check if user is restricted from signing in
 */
export async function isUserRestricted(email: string): Promise<boolean> {
  return userRestrictions[email] || false;
}

/**
 * Admin functions for user management
 */
export const adminFunctions = {
  /**
   * Set user role
   */
  setUserRole(email: string, role: 'user' | 'admin' | 'super_admin'): void {
    userRoles[email] = role;
  },

  /**
   * Remove user role (defaults to 'user')
   */
  removeUserRole(email: string): void {
    delete userRoles[email];
  },

  /**
   * Restrict user from signing in
   */
  restrictUser(email: string): void {
    userRestrictions[email] = true;
  },

  /**
   * Unrestrict user
   */
  unrestrictUser(email: string): void {
    delete userRestrictions[email];
  },

  /**
   * Get all users with their roles and restrictions
   */
  getAllUsers(): Array<{ email: string; role: string; isRestricted: boolean }> {
    const allEmails = new Set([
      ...Object.keys(userRoles),
      ...Object.keys(userRestrictions)
    ]);

    return Array.from(allEmails).map(email => ({
      email,
      role: userRoles[email] || 'user',
      isRestricted: userRestrictions[email] || false
    }));
  },

  /**
   * Send password reset email using Firebase
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Firebase handles password reset automatically
      // This is just a placeholder - the actual password reset should be done
      // through Firebase client-side authentication
      return { success: true, error: 'Use Firebase client-side password reset' };
    } catch (error) {
      return { success: false, error: 'Failed to send password reset' };
    }
  }
};
