'use client';

import { db } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'pending' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a new contact form submission using Firebase client SDK.
 */
export const createContactSubmission = async (data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<ContactSubmission> => {
  if (!db) {
    throw new Error('Firebase client SDK not initialized');
  }

  const submissionData = {
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    message: data.message,
    status: 'pending' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'contactSubmissions'), submissionData);
  
  return {
    id: docRef.id,
    ...submissionData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};
