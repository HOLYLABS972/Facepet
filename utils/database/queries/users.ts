'use server';

import { eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { users } from '../schema';

/**
 * Fetches user details.
 *
 * @param userId - The id of the user to retrieve.
 * @returns An object containing user fullName, phone, and email, or null if not found.
 */
export const getUserDetails = async (userId: string) => {
  const results = await db
    .select({
      fullName: users.fullName,
      phone: users.phone,
      email: users.email
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return results[0] ?? null;
};

/**
 * Fetches user details by email.
 *
 * @param email - The email of the user to retrieve.
 * @returns An object containing user fullName, phone, and email, or null if not found.
 */
export const getUserDetailsByEmail = async (email: string) => {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return results[0] ?? null;
};

/**
 * Updates the last activity date of a user to the current date and time.
 *
 * @param userId - The unique identifier of the user whose last activity date is to be updated.
 * @returns A promise that resolves when the update operation is complete.
 */
export const updateUserLastActivityDate = async (userId: string) => {
  await db
    .update(users)
    .set({ lastActivityDate: new Date() })
    .where(eq(users.id, userId));
};

/**
 * Checks if the user's last activity date is today.
 *
 * @param userId - The unique identifier of the user to check.
 * @returns A promise that resolves to a boolean indicating whether the last activity date is today.
 */
export const isUserActiveToday = async (userId: string): Promise<boolean> => {
  const results = await db
    .select({ lastActivityDate: users.lastActivityDate })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (results.length === 0) {
    return false;
  }

  const lastActivityDate = results[0].lastActivityDate;
  if (!lastActivityDate) {
    return false;
  }

  const today = new Date();
  return (
    lastActivityDate.getDate() === today.getDate() &&
    lastActivityDate.getMonth() === today.getMonth() &&
    lastActivityDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Checks if an email exists in the users table.
 *
 * @param email - The email address to check.
 * @returns A promise that resolves to the result of the query, which will contain the user data if the email exists.
 */
export const checkEmailExists = async (email: string) => {
  const emailLower = email.toLowerCase();
  return await db
    .select()
    .from(users)
    .where(eq(users.email, emailLower))
    .limit(1);
};

/**
 * Creates a new user record in the database.
 *
 * This function takes user details, converts the email to lowercase,
 * and inserts a new user into the `users` table.
 *
 * @param fullName - The full name of the user.
 * @param email - The user's email address.
 * @param phone - The user's phone number.
 * @param hashedPassword - The user's hashed password.
 * @param role - The user's role (default: 'user').
 * @returns A promise that resolves with the result of the insertion.
 */
export async function createUser(
  fullName: string,
  email: string,
  phone: string,
  hashedPassword: string,
  role: string = 'user'
) {
  const emailLower = email.toLowerCase();
  return await db.insert(users).values({
    fullName,
    email: emailLower,
    phone,
    password: hashedPassword,
    role
  });
}
