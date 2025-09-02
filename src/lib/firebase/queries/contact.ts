'use server';

import { adminDb } from '../admin';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy } from 'firebase-admin/firestore';

export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
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
  subject: string;
  message: string;
}): Promise<ContactSubmission> => {
  const now = new Date();
  const submissionData = {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    subject: data.subject,
    message: data.message,
    status: 'pending' as const,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(adminDb, 'contactSubmissions'), submissionData);
  
  return {
    id: docRef.id,
    ...submissionData
  };
};

/**
 * Fetches all contact submissions (admin only).
 */
export const getAllContactSubmissions = async (): Promise<ContactSubmission[]> => {
  const q = query(collection(adminDb, 'contactSubmissions'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
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
  const docRef = doc(adminDb, 'contactSubmissions', id);
  await updateDoc(docRef, {
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
  const docRef = doc(adminDb, 'contactSubmissions', id);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data()
  } as ContactSubmission;
};
