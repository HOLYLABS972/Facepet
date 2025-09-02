'use server';

import { adminDb } from '../admin';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc } from 'firebase-admin/firestore';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'admin' | 'super_admin';
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  lastActivityDate: Date;
  createdAt: Date;
}

/**
 * Fetches user details by ID.
 */
export const getUserDetails = async (userId: string): Promise<Pick<User, 'fullName' | 'phone' | 'email'> | null> => {
  const docRef = doc(adminDb, 'users', userId);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    return null;
  }

  const userData = docSnap.data() as User;
  return {
    fullName: userData.fullName,
    phone: userData.phone,
    email: userData.email
  };
};

/**
 * Fetches user details by email.
 */
export const getUserDetailsByEmail = async (email: string): Promise<User | null> => {
  const q = query(collection(adminDb, 'users'), where('email', '==', email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as User;
};

/**
 * Creates a new user.
 */
export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'lastActivityDate'>): Promise<User> => {
  const now = new Date();
  const newUser = {
    ...userData,
    email: userData.email.toLowerCase(),
    createdAt: now,
    lastActivityDate: now
  };

  const docRef = await addDoc(collection(adminDb, 'users'), newUser);
  
  return {
    id: docRef.id,
    ...newUser
  };
};

/**
 * Updates user details.
 */
export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  const docRef = doc(adminDb, 'users', userId);
  await updateDoc(docRef, updates);
};

/**
 * Updates user's last activity date.
 */
export const updateUserLastActivity = async (userId: string): Promise<void> => {
  const docRef = doc(adminDb, 'users', userId);
  await updateDoc(docRef, {
    lastActivityDate: new Date()
  });
};
