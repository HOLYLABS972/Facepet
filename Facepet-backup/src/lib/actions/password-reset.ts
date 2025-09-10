'use server';

import { db } from '@/utils/database/drizzle';
import { users } from '@/utils/database/schema';
import { eq } from 'drizzle-orm';
import {
  cleanupExpiredTokens as cleanupTokens,
  deletePasswordResetTokens,
  generateResetToken,
  hashPassword,
  markResetTokenAsUsed,
  storePasswordResetToken,
  updateUserPassword,
  validateResetToken as validateToken
} from './verification';

/**
 * Request password reset - sends email with reset link
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailLower = email.toLowerCase();

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, emailLower))
      .limit(1);

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (user.length === 0) {
      return { success: true }; // Don't reveal that user doesn't exist
    }

    // Check rate limiting
    const { checkEmailRateLimit } = await import('@/src/lib/email');
    const rateCheck = await checkEmailRateLimit(emailLower);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: 'Too many password reset requests. Please try again later.'
      };
    }

    // Delete any existing password reset tokens for this email
    await deletePasswordResetTokens(emailLower);

    // Generate new reset token
    const token = await generateResetToken();
    const expires = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    const storeResult = await storePasswordResetToken(
      emailLower,
      token,
      expires
    );
    if (!storeResult.success) {
      return { success: false, error: storeResult.error };
    }

    // Send password reset email
    const { sendPasswordResetEmail } = await import('@/src/lib/email');
    const userFirstname = user[0].fullName?.split(' ')[0] || 'User';

    const emailResult = await sendPasswordResetEmail(
      emailLower,
      token,
      userFirstname
    );
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Don't fail the entire process, but log the error
    }

    return { success: true };
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      error: 'An error occurred while processing your request'
    };
  }
}

/**
 * Validate password reset token
 */
export async function validateResetToken(
  token: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  return await validateToken(token);
}

/**
 * Reset password using valid token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long'
      };
    }

    // Validate token first
    const tokenValidation = await validateResetToken(token);
    if (!tokenValidation.success) {
      return { success: false, error: tokenValidation.error };
    }

    const email = tokenValidation.email!;

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    const updateResult = await updateUserPassword(email, hashedPassword);
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    // Mark token as used
    const markResult = await markResetTokenAsUsed(token);
    if (!markResult.success) {
      return { success: false, error: markResult.error };
    }

    // Send password change notification
    const { sendPasswordChangeNotification } = await import('@/src/lib/email');
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length) {
      const userFirstname = user[0].fullName?.split(' ')[0] || 'User';
      await sendPasswordChangeNotification(email, userFirstname);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'An error occurred while resetting your password'
    };
  }
}

/**
 * Clean up expired password reset tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  return await cleanupTokens();
}

// Clean up expired tokens every hour
if (typeof window === 'undefined') {
  setInterval(
    async () => {
      const cleaned = await cleanupExpiredTokens();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired password reset tokens`);
      }
    },
    60 * 60 * 1000
  );
}
