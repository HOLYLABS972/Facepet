'use server';

import { adminDb } from '../admin';

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
 * Creates a new contact form submission.
 */
export const createContactSubmission = async (data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<ContactSubmission> => {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  const now = new Date();
  const submissionData = {
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    message: data.message,
    status: 'pending' as const,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await adminDb.collection('contactSubmissions').add(submissionData);
  
  return {
    id: docRef.id,
    ...submissionData
  };
};

/**
 * Fetches all contact submissions (admin only).
 */
export const getAllContactSubmissions = async (): Promise<ContactSubmission[]> => {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  const querySnapshot = await adminDb.collection('contactSubmissions')
    .orderBy('createdAt', 'desc')
    .get();
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ContactSubmission));
};

/**
 * Updates the status of a contact submission.
 */
export const updateContactSubmissionStatus = async (
  id: string,
  status: 'pending' | 'read' | 'replied'
): Promise<ContactSubmission> => {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  const docRef = adminDb.collection('contactSubmissions').doc(id);
  await docRef.update({
    status,
    updatedAt: new Date()
  });

  const updatedDoc = await docRef.get();
  return {
    id: updatedDoc.id,
    ...updatedDoc.data()
  } as ContactSubmission;
};

/**
 * Fetches a contact submission by ID.
 */
export const getContactSubmissionById = async (id: string): Promise<ContactSubmission | null> => {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  const docRef = adminDb.collection('contactSubmissions').doc(id);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data()
  } as ContactSubmission;
};
