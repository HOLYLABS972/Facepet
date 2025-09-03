import { User } from 'firebase/auth';
import { getUserFromFirestore } from '@/lib/firebase/users';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserWithRole {
  user: User;
  role: UserRole;
}

/**
 * Check if a user has admin privileges
 */
export const isAdmin = (role: UserRole | null): boolean => {
  return role === 'admin' || role === 'super_admin';
};

/**
 * Check if a user has super admin privileges
 */
export const isSuperAdmin = (role: UserRole | null): boolean => {
  return role === 'super_admin';
};

/**
 * Get user role from Firestore
 */
export const getUserRole = async (user: User): Promise<UserRole | null> => {
  try {
    const userResult = await getUserFromFirestore(user.uid);
    if (userResult.success && userResult.user) {
      return userResult.user.role || 'user';
    }
    return 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};

/**
 * Check if user can access admin panel
 */
export const canAccessAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  const role = await getUserRole(user);
  return isAdmin(role);
};

/**
 * Check if user can manage users (super admin only)
 */
export const canManageUsers = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  const role = await getUserRole(user);
  return isSuperAdmin(role);
};
