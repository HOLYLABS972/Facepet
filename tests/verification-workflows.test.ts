/**
 * Complete Verification Workflows Integration Tests
 *
 * Tests complete user journeys:
 * 1. Signup with email confirmation
 * 2. Password change workflow
 * 3. Password reset workflow
 *
 * Run with: npx ts-node tests/verification-workflows.test.ts
 */

import { compare } from 'bcryptjs';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../utils/database/drizzle';
import {
  passwordResetTokens,
  users,
  VerificationCode
} from '../utils/database/schema';

// Import verification functions
import {
  deletePasswordResetTokens,
  generateResetToken,
  generateVerificationCode,
  hashPassword,
  markCodeAsUsed,
  storePasswordResetToken,
  updateUserPassword,
  validateCode,
  validateResetToken
} from '../src/lib/actions/verification';

// Mock email service for testing
const mockEmailService = {
  sendVerificationEmail: async (
    email: string,
    code: string,
    firstName: string
  ) => {
    console.log(
      `📧 Mock verification email sent to ${email} with code: ${code}`
    );
    return { success: true, messageId: 'mock-verification-' + Date.now() };
  },

  sendPasswordResetEmail: async (
    email: string,
    resetUrl: string,
    firstName: string
  ) => {
    console.log(
      `📧 Mock password reset email sent to ${email} with URL: ${resetUrl}`
    );
    return { success: true, messageId: 'mock-reset-' + Date.now() };
  },

  sendPasswordChangeNotification: async (email: string, firstName: string) => {
    console.log(`📧 Mock password change notification sent to ${email}`);
    return { success: true, messageId: 'mock-notification-' + Date.now() };
  }
};

class WorkflowTestSuite {
  private testUsers: Array<{ id: string; email: string; password: string }> =
    [];
  private baseEmail = `workflow-test-${Date.now()}`;

  async cleanup() {
    console.log('🧹 Cleaning up test data...');

    for (const user of this.testUsers) {
      await db.delete(users).where(eq(users.email, user.email));
      await db
        .delete(VerificationCode)
        .where(eq(VerificationCode.email, user.email));
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.email, user.email));
    }

    console.log('✅ Test cleanup completed');
  }

  async testSignupWithEmailConfirmation() {
    console.log(
      '\n🧪 Testing Complete Signup with Email Confirmation Workflow...'
    );

    const email = `${this.baseEmail}-signup@example.com`;
    const password = 'testpassword123';
    const fullName = 'Test Signup User';

    try {
      // Step 1: Create unverified user (simulate signup)
      console.log('📝 Step 1: Creating unverified user account...');
      const hashedPassword = await hashPassword(password);

      const [newUser] = await db
        .insert(users)
        .values({
          fullName,
          email,
          phone: '+1234567890',
          password: hashedPassword,
          emailVerified: false
        })
        .returning();

      this.testUsers.push({ id: newUser.id, email, password: hashedPassword });
      console.log('✅ User account created successfully');

      // Step 2: Generate and send verification code
      console.log('📧 Step 2: Generating verification code...');
      const codeResult = await generateVerificationCode(email);

      if (!codeResult.success || !codeResult.code) {
        throw new Error('Failed to generate verification code');
      }

      await mockEmailService.sendVerificationEmail(
        email,
        codeResult.code,
        fullName.split(' ')[0]
      );
      console.log('✅ Verification code generated and email sent');

      // Step 3: User enters verification code
      console.log('✅ Step 3: Validating verification code...');
      const validationResult = await validateCode(
        email,
        codeResult.code,
        'email_verification'
      );

      if (!validationResult.success) {
        throw new Error('Verification code validation failed');
      }

      console.log('✅ Verification code validated successfully');

      // Step 4: Mark code as used and update user
      console.log('🔄 Step 4: Completing email verification...');
      const markResult = await markCodeAsUsed(
        email,
        codeResult.code,
        'email_verification'
      );

      if (!markResult.success) {
        throw new Error('Failed to mark verification code as used');
      }

      // Update user as verified
      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerifiedAt: new Date()
        })
        .where(eq(users.email, email));

      console.log('✅ Email verification completed successfully');

      // Step 5: Verify user is now verified
      const verifiedUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (verifiedUser[0]?.emailVerified) {
        console.log('✅ User email verification status confirmed');
        console.log(
          '🎉 Signup with email confirmation workflow completed successfully!'
        );
      } else {
        throw new Error('User verification status not updated');
      }
    } catch (error) {
      console.error(
        '❌ Signup with email confirmation workflow failed:',
        error
      );
      throw error;
    }
  }

  async testPasswordChangeWorkflow() {
    console.log('\n🧪 Testing Complete Password Change Workflow...');

    const email = `${this.baseEmail}-change@example.com`;
    const currentPassword = 'currentpassword123';
    const newPassword = 'newpassword456';
    const fullName = 'Test Change User';

    try {
      // Step 1: Create verified user
      console.log('👤 Step 1: Creating verified user...');
      const hashedCurrentPassword = await hashPassword(currentPassword);

      const [user] = await db
        .insert(users)
        .values({
          fullName,
          email,
          phone: '+1234567890',
          password: hashedCurrentPassword,
          emailVerified: true,
          emailVerifiedAt: new Date()
        })
        .returning();

      this.testUsers.push({
        id: user.id,
        email,
        password: hashedCurrentPassword
      });
      console.log('✅ Verified user created');

      // Step 2: Verify current password
      console.log('🔐 Step 2: Verifying current password...');
      const passwordValid = await compare(
        currentPassword,
        hashedCurrentPassword
      );

      if (!passwordValid) {
        throw new Error('Current password verification failed');
      }

      console.log('✅ Current password verified');

      // Step 3: Generate verification code for password change
      console.log('📧 Step 3: Generating password change verification code...');
      const codeResult = await generateVerificationCode(email);

      if (!codeResult.success || !codeResult.code) {
        throw new Error('Failed to generate password change verification code');
      }

      await mockEmailService.sendVerificationEmail(
        email,
        codeResult.code,
        fullName.split(' ')[0]
      );
      console.log('✅ Password change verification code sent');

      // Step 4: User enters verification code
      console.log('✅ Step 4: Validating password change code...');
      const validationResult = await validateCode(
        email,
        codeResult.code,
        'password_reset'
      );

      if (!validationResult.success) {
        throw new Error('Password change code validation failed');
      }

      console.log('✅ Password change code validated');

      // Step 5: Update password
      console.log('🔄 Step 5: Updating password...');
      const hashedNewPassword = await hashPassword(newPassword);
      const updateResult = await updateUserPassword(email, hashedNewPassword);

      if (!updateResult.success) {
        throw new Error('Password update failed');
      }

      // Mark verification code as used
      await markCodeAsUsed(email, codeResult.code, 'password_reset');

      console.log('✅ Password updated successfully');

      // Step 6: Send confirmation notification
      console.log('📧 Step 6: Sending password change notification...');
      await mockEmailService.sendPasswordChangeNotification(
        email,
        fullName.split(' ')[0]
      );
      console.log('✅ Password change notification sent');

      // Step 7: Verify new password works
      console.log('🔐 Step 7: Verifying new password...');
      const updatedUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      const newPasswordValid = await compare(
        newPassword,
        updatedUser[0].password
      );

      if (newPasswordValid) {
        console.log('✅ New password verification successful');
        console.log('🎉 Password change workflow completed successfully!');
      } else {
        throw new Error('New password verification failed');
      }
    } catch (error) {
      console.error('❌ Password change workflow failed:', error);
      throw error;
    }
  }

  async testPasswordResetWorkflow() {
    console.log('\n🧪 Testing Complete Password Reset Workflow...');

    const email = `${this.baseEmail}-reset@example.com`;
    const originalPassword = 'originalpassword123';
    const newPassword = 'resetpassword789';
    const fullName = 'Test Reset User';

    try {
      // Step 1: Create user who forgot password
      console.log('👤 Step 1: Creating user account...');
      const hashedOriginalPassword = await hashPassword(originalPassword);

      const [user] = await db
        .insert(users)
        .values({
          fullName,
          email,
          phone: '+1234567890',
          password: hashedOriginalPassword,
          emailVerified: true,
          emailVerifiedAt: new Date()
        })
        .returning();

      this.testUsers.push({
        id: user.id,
        email,
        password: hashedOriginalPassword
      });
      console.log('✅ User account created');

      // Step 2: User requests password reset
      console.log('🔑 Step 2: Generating password reset token...');
      const resetToken = generateResetToken();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const storeResult = await storePasswordResetToken(
        email,
        resetToken,
        expires
      );

      if (!storeResult.success) {
        throw new Error('Failed to store password reset token');
      }

      console.log('✅ Password reset token generated and stored');

      // Step 3: Send password reset email
      console.log('📧 Step 3: Sending password reset email...');
      const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
      await mockEmailService.sendPasswordResetEmail(
        email,
        resetUrl,
        fullName.split(' ')[0]
      );
      console.log('✅ Password reset email sent');

      // Step 4: User clicks link and validates token
      console.log('🔐 Step 4: Validating reset token...');
      const tokenValidation = await validateResetToken(resetToken);

      if (!tokenValidation.success || tokenValidation.email !== email) {
        throw new Error('Reset token validation failed');
      }

      console.log('✅ Reset token validated successfully');

      // Step 5: User sets new password
      console.log('🔄 Step 5: Setting new password...');
      const hashedNewPassword = await hashPassword(newPassword);
      const updateResult = await updateUserPassword(email, hashedNewPassword);

      if (!updateResult.success) {
        throw new Error('Password update failed');
      }

      console.log('✅ New password set successfully');

      // Step 6: Clean up reset tokens
      console.log('🧹 Step 6: Cleaning up reset tokens...');
      await deletePasswordResetTokens(email);
      console.log('✅ Reset tokens cleaned up');

      // Step 7: Send confirmation notification
      console.log('📧 Step 7: Sending password change notification...');
      await mockEmailService.sendPasswordChangeNotification(
        email,
        fullName.split(' ')[0]
      );
      console.log('✅ Password change notification sent');

      // Step 8: Verify new password works
      console.log('🔐 Step 8: Verifying new password...');
      const updatedUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      const newPasswordValid = await compare(
        newPassword,
        updatedUser[0].password
      );

      if (newPasswordValid) {
        console.log('✅ New password verification successful');
        console.log('🎉 Password reset workflow completed successfully!');
      } else {
        throw new Error('New password verification failed');
      }
    } catch (error) {
      console.error('❌ Password reset workflow failed:', error);
      throw error;
    }
  }

  async runAllWorkflowTests() {
    console.log('🚀 Starting Complete Verification Workflow Tests...');
    console.log('='.repeat(70));

    try {
      await this.testSignupWithEmailConfirmation();
      await this.testPasswordChangeWorkflow();
      await this.testPasswordResetWorkflow();

      console.log('\n' + '='.repeat(70));
      console.log('✅ All verification workflow tests passed!');
      console.log('\n📊 Workflow Test Summary:');
      console.log('- Signup with email confirmation: ✅');
      console.log('- Password change workflow: ✅');
      console.log('- Password reset workflow: ✅');
      console.log('\n🎉 All verification workflows are working correctly!');
    } catch (error) {
      console.error('\n❌ Workflow test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const workflowTests = new WorkflowTestSuite();
  workflowTests.runAllWorkflowTests().catch(console.error);
}

export { WorkflowTestSuite };
