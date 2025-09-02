'use server';

// import { auth } from '@/auth'; // Removed - using Firebase Auth
import { db } from '@/utils/database/drizzle';
import { users } from '@/utils/database/schema';
import { compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import {
  deleteVerificationCodes,
  generateVerificationCode,
  getPendingPasswordChange,
  hashPassword,
  markCodeAsUsed,
  removePendingPasswordChange,
  storePendingPasswordChange,
  updateUserPassword,
  validateCode
} from './verification';

/**
 * Request password change with email verification
 */
export async function requestPasswordChange(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const email = session.user.email.toLowerCase();

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(
      currentPassword,
      user[0].password
    );
    if (!isCurrentPasswordValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Validate new password
    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'New password must be at least 8 characters long'
      };
    }

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

    // Delete any existing password change verification codes
    await deleteVerificationCodes(email, 'password_reset');

    // Generate and store verification code for password reset
    const codeResult = await generateVerificationCode(email, 'password_reset');
    if (!codeResult.success) {
      return { success: false, error: codeResult.error };
    }

    // Store verification code with new password hash
    const hashedNewPassword = await hashPassword(newPassword);
    const expires = new Date(new Date().getTime() + 10 * 60000); // 10 minutes

    // Store the new password hash temporarily (in a more secure implementation,
    // you might want to encrypt this or use a separate table)
    // For now, we'll store it in memory or use a different approach

    // Send verification email
    const { sendVerificationEmail } = await import('@/src/lib/email');
    const userFirstname = user[0].fullName?.split(' ')[0] || 'User';

    const emailResult = await sendVerificationEmail(
      email,
      codeResult.code!,
      userFirstname
    );
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return { success: false, error: 'Failed to send verification email' };
    }

    // Store the new password hash in temporary storage
    storePendingPasswordChange(email, hashedNewPassword, expires);

    return { success: true };
  } catch (error: any) {
    console.error('Password change request error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Confirm password change with verification code
 */
export async function confirmPasswordChange(
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const email = session.user.email.toLowerCase();

    // Validate verification code
    const validationResult = await validateCode(email, code, 'password_reset');
    if (!validationResult.success) {
      return { success: false, error: validationResult.error };
    }

    // Get pending password change
    const pendingChange = await getPendingPasswordChange(email);
    if (!pendingChange || Date.now() > pendingChange.expires) {
      return { success: false, error: 'Password change request has expired' };
    }

    // Update user password
    const updateResult = await updateUserPassword(
      email,
      pendingChange.hashedPassword
    );
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    // Mark verification code as used
    const markResult = await markCodeAsUsed(email, code, 'password_reset');
    if (!markResult.success) {
      return { success: false, error: markResult.error };
    }

    // Clean up pending change
    removePendingPasswordChange(email);

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
    console.error('Password change confirmation error:', error);
    return { success: false, error: error.message };
  }
}

// Password change functionality is now centralized in verification.ts
// The temporary storage and cleanup are handled there
