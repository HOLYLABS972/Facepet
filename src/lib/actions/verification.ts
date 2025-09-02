'use server';

import { auth } from '@/auth';
import { db } from '@/utils/database/drizzle';
import { users, VerificationCode } from '@/utils/database/schema';
import { and, eq, lt } from 'drizzle-orm';

// Types for verification operations
export type VerificationType =
  | 'email_verification'
  | 'password_reset'
  | 'email_change';

export interface VerificationResult {
  success: boolean;
  error?: string;
  code?: string;
  email?: string;
}

export interface AccessControlResult {
  hasAccess: boolean;
  verificationType?: VerificationType;
  error?: string;
}

// Pending password changes are now stored in the VerificationCode table

/**
 * Generates a 6-digit verification code for the given email,
 * stores it in the database with a 15-minute expiry,
 * and sends the code by email.
 *
 * @param email - The email address of the user.
 * @param type - The type of verification code to generate.
 * @returns An object indicating success or failure.
 */
export async function generateVerificationCode(
  email: string,
  type: VerificationType = 'email_verification'
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    // Generate a random 6-digit code as a string
    const code = await generateCode();
    console.log(code);
    // Set expiration date (e.g., 5 minutes from now)
    const expires = new Date(new Date().getTime() + 5 * 60000);
    console.log(expires);
    // Insert into the verification_codes table
    await db.insert(VerificationCode).values({
      email,
      code,
      type,
      expires
    });

    // Send the verification code via email
    const { sendVerificationEmail } = await import('@/src/lib/email');
    const { getUserDetailsByEmail } = await import(
      '@/utils/database/queries/users'
    );

    const user = await getUserDetailsByEmail(email);
    const userFirstname = user?.fullName?.split(' ')[0] || 'User';

    const emailResult = await sendVerificationEmail(email, code, userFirstname);
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail the entire process if email fails, but log it
    }

    return { success: true, code };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Validates the verification code for the given email.
 * If valid and not expired, activates the user's account.
 *
 * @param email - The email address of the user.
 * @param code - The verification code provided by the user.
 * @returns An object indicating success or failure.
 */
export async function validateVerificationCode(
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !session.user || !session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    // Retrieve the verification record for the email and code
    const records = await db
      .select()
      .from(VerificationCode)
      .where(
        and(
          eq(VerificationCode.email, session?.user?.email),
          eq(VerificationCode.code, code),
          eq(VerificationCode.used, false)
        )
      )
      .limit(1);

    if (!records.length) {
      return { success: false, error: 'Invalid verification code' };
    }

    const record = records[0];

    // Check if the code is expired
    if (new Date(record.expires) < new Date()) {
      return { success: false, error: 'Verification code has expired' };
    }

    // Handle different verification types
    if (record.type === 'email_verification') {
      // Activate the user account for email verification
      await activateUserAccount(session?.user?.email);
    } else if (record.type === 'password_reset') {
      // For password reset, delegate to password change confirmation
      const { confirmPasswordChange } = await import('./password-change');
      return await confirmPasswordChange(code);
    } else if (record.type === 'email_change') {
      // For email change, handle email change confirmation
      // This would need to be implemented based on your email change flow
      return {
        success: false,
        error: 'Email change verification not implemented yet'
      };
    }

    // Mark the verification code as used
    await db
      .update(VerificationCode)
      .set({ used: true })
      .where(eq(VerificationCode.id, record.id));

    return { success: true };
  } catch (error: any) {
    console.error('Verification code validation error:', error);
    return { success: false, error: 'error occurred while validating code' };
  }
}

/**
 * Resend verification code for the current user
 * This function works whether or not there's an existing pending verification code
 */
export async function resendVerificationCode(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session || !session.user || !session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const email = session.user.email.toLowerCase();

    // Check rate limiting
    const { checkEmailRateLimit } = await import('@/src/lib/email');
    const rateCheck = await checkEmailRateLimit(email);
    if (!rateCheck.allowed) {
      const resetTime = new Date(rateCheck.resetTime!);
      return {
        success: false,
        error: `Too many requests. Try again after ${resetTime.toLocaleTimeString()}`
      };
    }

    // Check if user is already verified
    const { isEmailVerified } = await import(
      '@/src/middleware/email-verification'
    );
    const userEmailVerified = await isEmailVerified(email);
    if (userEmailVerified) {
      return { success: false, error: 'Email is already verified' };
    }

    // Delete any existing verification codes for this email (email_verification type only)
    // This handles both cases: existing codes and no existing codes
    await db
      .delete(VerificationCode)
      .where(
        and(
          eq(VerificationCode.email, email),
          eq(VerificationCode.type, 'email_verification')
        )
      );

    // Generate new verification code
    const result = await generateVerificationCode(email);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Activates a user account by setting its "activated" field to true.
 *
 * @param email - The email address of the user to activate.
 */
async function activateUserAccount(email: string): Promise<void> {
  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerifiedAt: new Date()
    })
    .where(eq(users.email, email));
}

// ============================================================================
// CORE VERIFICATION UTILITIES
// ============================================================================

/**
 * Generate a 6-digit verification code
 */
export async function generateCode(): Promise<string> {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a secure password reset token
 */
export async function generateResetToken(): Promise<string> {
  const { randomBytes } = require('crypto');
  return randomBytes(32).toString('hex');
}

/**
 * Check if the current user has a valid pending verification code
 * This is used to control access to the confirmation page
 */
export async function hasValidPendingVerification(): Promise<AccessControlResult> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return { hasAccess: false, error: 'Not authenticated' };
    }

    // Check if there's a valid pending verification code for this user
    const pendingVerification = await db
      .select()
      .from(VerificationCode)
      .where(
        and(
          eq(VerificationCode.email, session.user.email),
          eq(VerificationCode.used, false)
        )
      )
      .orderBy(VerificationCode.createdAt)
      .limit(1);

    if (!pendingVerification.length) {
      return { hasAccess: false, error: 'No pending verification found' };
    }

    const verificationCode = pendingVerification[0];

    // Check if the verification code is expired
    if (new Date() > verificationCode.expires) {
      return { hasAccess: false, error: 'Verification code has expired' };
    }

    return {
      hasAccess: true,
      verificationType: verificationCode.type
    };
  } catch (error: any) {
    console.error('Error checking verification access:', error);
    return { hasAccess: false, error: 'Internal error' };
  }
}

/**
 * Validate verification code for any type
 */
export async function validateCode(
  email: string,
  code: string,
  type: VerificationType
): Promise<VerificationResult> {
  try {
    // Retrieve the verification record for the email and code
    const records = await db
      .select()
      .from(VerificationCode)
      .where(
        and(
          eq(VerificationCode.email, email),
          eq(VerificationCode.code, code),
          eq(VerificationCode.type, type),
          eq(VerificationCode.used, false)
        )
      )
      .limit(1);

    if (!records.length) {
      return { success: false, error: 'Invalid verification code' };
    }

    const record = records[0];

    // Check if the code is expired
    if (new Date(record.expires) < new Date()) {
      return { success: false, error: 'Verification code has expired' };
    }

    return { success: true, email, code };
  } catch (error: any) {
    console.error('Code validation error:', error);
    return { success: false, error: 'Error occurred while validating code' };
  }
}

/**
 * Mark verification code as used
 */
export async function markCodeAsUsed(
  email: string,
  code: string,
  type: VerificationType
): Promise<VerificationResult> {
  try {
    const record = await db
      .select()
      .from(VerificationCode)
      .where(
        and(
          eq(VerificationCode.email, email),
          eq(VerificationCode.code, code),
          eq(VerificationCode.type, type),
          eq(VerificationCode.used, false)
        )
      )
      .limit(1);

    if (!record.length) {
      return { success: false, error: 'Verification code not found' };
    }

    await db
      .update(VerificationCode)
      .set({ used: true })
      .where(eq(VerificationCode.id, record[0].id));

    return { success: true };
  } catch (error: any) {
    console.error('Error marking code as used:', error);
    return { success: false, error: 'Error occurred while updating code' };
  }
}

/**
 * Delete verification codes of a specific type for an email
 */
export async function deleteVerificationCodes(
  email: string,
  type: VerificationType
): Promise<void> {
  await db
    .delete(VerificationCode)
    .where(
      and(eq(VerificationCode.email, email), eq(VerificationCode.type, type))
    );
}

// ============================================================================
// PASSWORD CHANGE UTILITIES
// ============================================================================

/**
 * Store pending password change by updating the existing verification code entry
 */
export async function storePendingPasswordChange(
  email: string,
  hashedPassword: string,
  expiresAt: Date
): Promise<void> {
  // Update the existing verification code entry with the hashed password
  await db
    .update(VerificationCode)
    .set({
      hashedPassword,
      expires: expiresAt
    })
    .where(
      and(
        eq(VerificationCode.email, email),
        eq(VerificationCode.type, 'password_reset'),
        eq(VerificationCode.used, false)
      )
    );
}

/**
 * Get pending password change from verification codes table
 */
export async function getPendingPasswordChange(
  email: string
): Promise<{ hashedPassword: string; expires: number } | undefined> {
  const result = await db
    .select()
    .from(VerificationCode)
    .where(
      and(
        eq(VerificationCode.email, email),
        eq(VerificationCode.type, 'password_reset'),
        eq(VerificationCode.used, false)
      )
    )
    .orderBy(VerificationCode.createdAt)
    .limit(1);

  if (result.length === 0 || !result[0].hashedPassword) {
    return undefined;
  }

  const change = result[0];
  return {
    hashedPassword: change.hashedPassword!,
    expires: change.expires.getTime()
  };
}

/**
 * Remove pending password change from verification codes table
 */
export async function removePendingPasswordChange(
  email: string
): Promise<void> {
  await db
    .delete(VerificationCode)
    .where(
      and(
        eq(VerificationCode.email, email),
        eq(VerificationCode.type, 'password_reset')
      )
    );
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const { hash } = require('bcryptjs');
  return await hash(password, 10);
}

/**
 * Update user password in database
 */
export async function updateUserPassword(
  email: string,
  hashedPassword: string
): Promise<VerificationResult> {
  try {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email));

    return { success: true };
  } catch (error: any) {
    console.error('Error updating user password:', error);
    return { success: false, error: 'Error occurred while updating password' };
  }
}

// ============================================================================
// PASSWORD RESET TOKEN UTILITIES
// ============================================================================

/**
 * Validate password reset token
 */
export async function validateResetToken(
  token: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const { passwordResetTokens } = require('@/utils/database/schema');

    // Find the reset token
    const resetRecord = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false)
        )
      )
      .limit(1);

    if (!resetRecord.length) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    const record = resetRecord[0];

    // Check if token is expired
    if (new Date() > record.expires) {
      // Clean up expired token
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, record.id));

      return { success: false, error: 'Reset token has expired' };
    }

    return { success: true, email: record.email };
  } catch (error: any) {
    console.error('Token validation error:', error);
    return {
      success: false,
      error: 'An error occurred while validating the token'
    };
  }
}

/**
 * Mark password reset token as used
 */
export async function markResetTokenAsUsed(
  token: string
): Promise<VerificationResult> {
  try {
    const { passwordResetTokens } = require('@/utils/database/schema');

    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));

    return { success: true };
  } catch (error: any) {
    console.error('Error marking reset token as used:', error);
    return { success: false, error: 'Error occurred while updating token' };
  }
}

/**
 * Delete password reset tokens for an email
 */
export async function deletePasswordResetTokens(email: string): Promise<void> {
  const { passwordResetTokens } = require('@/utils/database/schema');

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.email, email));
}

/**
 * Store password reset token
 */
export async function storePasswordResetToken(
  email: string,
  token: string,
  expires: Date
): Promise<VerificationResult> {
  try {
    const { passwordResetTokens } = require('@/utils/database/schema');

    await db.insert(passwordResetTokens).values({
      email,
      token,
      expires
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error storing reset token:', error);
    return { success: false, error: 'Error occurred while storing token' };
  }
}

/**
 * Clean up expired password reset tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const { passwordResetTokens } = require('@/utils/database/schema');

    const result = await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.expires, new Date()));

    return result.rowCount || 0;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
}

/**
 * Clean up expired pending password changes from verification codes table
 */
export async function cleanupExpiredPendingPasswordChanges(): Promise<number> {
  try {
    const result = await db
      .delete(VerificationCode)
      .where(
        and(
          eq(VerificationCode.type, 'password_reset'),
          lt(VerificationCode.expires, new Date())
        )
      );

    return result.rowCount || 0;
  } catch (error) {
    console.error('Error cleaning up expired pending password changes:', error);
    return 0;
  }
}

// Clean up expired pending changes and tokens every hour
if (typeof window === 'undefined') {
  setInterval(
    async () => {
      // Clean up expired pending password changes
      const cleanedPending = await cleanupExpiredPendingPasswordChanges();
      if (cleanedPending > 0) {
        console.log(
          `Cleaned up ${cleanedPending} expired pending password changes`
        );
      }

      // Clean up expired password reset tokens
      const cleanedTokens = await cleanupExpiredTokens();
      if (cleanedTokens > 0) {
        console.log(
          `Cleaned up ${cleanedTokens} expired password reset tokens`
        );
      }
    },
    60 * 60 * 1000
  );
}
