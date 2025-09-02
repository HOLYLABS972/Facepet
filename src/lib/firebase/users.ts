import { db } from './config';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
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

    const userData: UserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      phone: additionalData?.phone || '',
      profileImage: additionalData?.profileImage || '',
      acceptCookies: additionalData?.acceptCookies || false,
      language: additionalData?.language || 'en',
      role: additionalData?.role || 'user', // Default role is 'user'
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Use the user's UID as the document ID for easier querying
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, userData);

    console.log('User created in Firestore:', user.uid);
    return { success: true };
  } catch (error: any) {
    console.error('Error creating user in Firestore:', error);
    return { success: false, error: 'Failed to create user in Firestore' };
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
