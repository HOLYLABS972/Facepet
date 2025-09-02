'use server';

import { render } from '@react-email/render';
import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_TOKEN);

// Email configuration
const EMAIL_FROM = 'Facepet <noreply@noreply.facepet.club>';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  react?: React.ReactElement;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Validate required fields
    if (!options.to || !options.subject) {
      return {
        success: false,
        error: 'Missing required fields: to and subject are required'
      };
    }

    // Prepare email content
    let htmlContent = options.html;
    if (options.react && !htmlContent) {
      // Always await to handle both sync and async render results
      htmlContent = await Promise.resolve(render(options.react));
    }

    if (!htmlContent && !options.text) {
      return {
        success: false,
        error: 'Email must have either HTML or text content'
      };
    }

    const email: any = {
      from: EMAIL_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject
    };
    if (htmlContent) email.html = htmlContent;
    if (options.text) email.text = options.text;

    console.log('Sending email:', email);

    // Send email
    const result = await resend.emails.send(email);

    if (result.error) {
      console.error('Resend error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Failed to send email'
      };
    }

    console.log('Email sent successfully:', result.data?.id);
    return {
      success: true,
      messageId: result.data?.id
    };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending email'
    };
  }
}

/**
 * Send verification code email
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  userFirstname: string
): Promise<EmailResult> {
  // We'll import the email template dynamically to avoid circular dependencies
  const { default: VerificationEmailContent } = await import(
    '../../emails/verification-code'
  );

  return sendEmail({
    to: email,
    subject: 'Verify your email address - Facepet',
    react: VerificationEmailContent({
      userFirstname,
      verificationCode: code
    })
  });
}

/**
 * Send password reset email with reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userFirstname: string
): Promise<EmailResult> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

  const { default: PasswordResetEmailContent } = await import(
    '../../emails/password-reset'
  );

  return sendEmail({
    to: email,
    subject: 'Reset your password - Facepet',
    react: PasswordResetEmailContent({
      userFirstname,
      resetUrl
    })
  });
}

/**
 * Send email change confirmation
 */
export async function sendEmailChangeConfirmation(
  newEmail: string,
  token: string,
  userFirstname: string
): Promise<EmailResult> {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/confirm-email-change?token=${token}`;

  // We'll create this template next
  const { default: EmailChangeConfirmationContent } = await import(
    '../../emails/email-change-confirmation'
  );

  return sendEmail({
    to: newEmail,
    subject: 'Confirm your new email address - Facepet',
    react: EmailChangeConfirmationContent({
      userFirstname,
      confirmUrl
    })
  });
}

/**
 * Send password change notification
 */
export async function sendPasswordChangeNotification(
  email: string,
  userFirstname: string
): Promise<EmailResult> {
  // We'll create this template next
  const { default: PasswordChangeNotificationContent } = await import(
    '../../emails/password-change-notification'
  );

  return sendEmail({
    to: email,
    subject: 'Your password has been changed - Facepet',
    react: PasswordChangeNotificationContent({
      userFirstname
    })
  });
}

/**
 * Check email rate limiting
 */
export async function checkEmailRateLimit(
  email: string
): Promise<{ allowed: boolean; resetTime?: number }> {
  const { checkEmailRateLimit: checkRate } = await import('./rate-limit');
  return checkRate(email);
}
