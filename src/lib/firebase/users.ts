import { db } from './config';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  acceptCookies?: boolean;
  language?: string;
  role?: 'user' | 'admin' | 'super_admin';
  createdAt: Date;
  updatedAt: Date;
}

export async function createUserInFirestore(
  user: User,
  additionalData?: {
    phone?: string;
    address?: string;
    profileImage?: string;
    acceptCookies?: boolean;
    language?: string;
    role?: 'user' | 'admin' | 'super_admin';
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!user.email) {
      return { success: false, error: 'User email is required' };
    }

    // Check if user already exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const existingUserDoc = await getDoc(userDocRef);
    
    if (existingUserDoc.exists()) {
      // User exists - preserve existing data and only update necessary fields
      const existingData = existingUserDoc.data() as UserData;
      
      const updateData: Partial<UserData> = {
        email: user.email, // Update email in case it changed
        displayName: user.displayName || existingData.displayName,
        profileImage: user.photoURL || existingData.profileImage,
        updatedAt: new Date(),
      };

      // Only update phone, address, acceptCookies, language if they're provided and different
      if (additionalData?.phone !== undefined) {
        updateData.phone = additionalData.phone;
      }
      if (additionalData?.address !== undefined) {
        updateData.address = additionalData.address;
      }
      if (additionalData?.acceptCookies !== undefined) {
        updateData.acceptCookies = additionalData.acceptCookies;
      }
      if (additionalData?.language !== undefined) {
        updateData.language = additionalData.language;
      }

      // CRITICAL: Preserve existing role - don't override it!
      // Only set role if it's not already set (for truly new users)
      if (!existingData.role && additionalData?.role) {
        updateData.role = additionalData.role;
      }

      await setDoc(userDocRef, updateData, { merge: true });
      console.log('User updated in Firestore (preserved existing data):', user.uid);
    } else {
      // New user - create with provided data
      const userData: UserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        phone: additionalData?.phone || '',
        address: additionalData?.address || '',
        profileImage: user.photoURL || additionalData?.profileImage || '',
        acceptCookies: additionalData?.acceptCookies || false,
        language: additionalData?.language || 'en',
        role: additionalData?.role || 'user', // Default role is 'user'
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(userDocRef, userData);
      console.log('New user created in Firestore:', user.uid);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error creating/updating user in Firestore:', error);
    return { success: false, error: 'Failed to create/update user in Firestore' };
  }
}

export async function getUserFromFirestore(
  uid: string
): Promise<{ success: boolean; user?: UserData; error?: string }> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return { success: true, user: userDocSnap.data() as UserData };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error: any) {
    console.error('Error getting user from Firestore:', error);
    return { success: false, error: 'Failed to get user from Firestore' };
  }
}

export async function updateUserInFirestore(
  uid: string,
  updateData: Partial<UserData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...updateData,
      updatedAt: new Date(),
    }, { merge: true });

    console.log('User updated in Firestore:', uid);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user in Firestore:', error);
    return { success: false, error: 'Failed to update user in Firestore' };
  }
}

/**
 * Handle user authentication without overriding existing role
 * This function is specifically designed to preserve user roles during authentication
 */
export async function handleUserAuthentication(
  user: User,
  additionalData?: {
    phone?: string;
    profileImage?: string;
    acceptCookies?: boolean;
    language?: string;
  }
): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> {
  try {
    if (!user.email) {
      return { success: false, error: 'User email is required' };
    }

    // Check if user already exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const existingUserDoc = await getDoc(userDocRef);
    
    if (existingUserDoc.exists()) {
      // User exists - only update authentication-related fields, preserve role
      const existingData = existingUserDoc.data() as UserData;
      
      const updateData: Partial<UserData> = {
        email: user.email, // Update email in case it changed
        displayName: user.displayName || existingData.displayName,
        profileImage: user.photoURL || existingData.profileImage,
        updatedAt: new Date(),
      };

      // Only update optional fields if they're provided
      if (additionalData?.phone !== undefined) {
        updateData.phone = additionalData.phone;
      }
      if (additionalData?.acceptCookies !== undefined) {
        updateData.acceptCookies = additionalData.acceptCookies;
      }
      if (additionalData?.language !== undefined) {
        updateData.language = additionalData.language;
      }

      // IMPORTANT: Do NOT touch the role field - preserve existing role
      await setDoc(userDocRef, updateData, { merge: true });
      console.log('User authenticated (preserved existing role):', user.uid);
      return { success: true, isNewUser: false };
    } else {
      // New user - create with default role
      const userData: UserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        phone: additionalData?.phone || '',
        profileImage: user.photoURL || additionalData?.profileImage || '',
        acceptCookies: additionalData?.acceptCookies || false,
        language: additionalData?.language || 'en',
        role: 'user', // Default role for new users
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(userDocRef, userData);
      console.log('New user created during authentication:', user.uid);
      return { success: true, isNewUser: true };
    }
  } catch (error: any) {
    console.error('Error handling user authentication:', error);
    return { success: false, error: 'Failed to handle user authentication' };
  }
}
