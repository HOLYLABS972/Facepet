'use server';

import { eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { contactSubmissions } from '../schema';

/**
 * Creates a new contact form submission.
 *
 * @param data - The contact form data.
 * @returns The created contact submission.
 */
export const createContactSubmission = async (data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) => {
  const [submission] = await db
    .insert(contactSubmissions)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
      status: 'pending'
    })
    .returning();

  return submission;
};

/**
 * Fetches all contact submissions (admin only).
 *
 * @returns Array of contact submissions.
 */
export const getAllContactSubmissions = async () => {
  const submissions = await db
    .select()
    .from(contactSubmissions)
    .orderBy(contactSubmissions.createdAt);

  return submissions;
};

/**
 * Updates the status of a contact submission.
 *
 * @param id - The submission ID.
 * @param status - The new status.
 * @returns The updated submission.
 */
export const updateContactSubmissionStatus = async (
  id: string,
  status: 'pending' | 'read' | 'replied'
) => {
  const [submission] = await db
    .update(contactSubmissions)
    .set({
      status,
      updatedAt: new Date()
    })
    .where(eq(contactSubmissions.id, id))
    .returning();

  return submission;
};

/**
 * Fetches a contact submission by ID.
 *
 * @param id - The submission ID.
 * @returns The contact submission or null if not found.
 */
export const getContactSubmissionById = async (id: string) => {
  const [submission] = await db
    .select()
    .from(contactSubmissions)
    .where(eq(contactSubmissions.id, id))
    .limit(1);

  return submission ?? null;
};
