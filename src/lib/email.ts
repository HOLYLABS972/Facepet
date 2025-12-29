'use server';

import { render } from '@react-email/render';
import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_TOKEN);

// Email configuration
// You can override this with EMAIL_FROM environment variable
// Using Resend's test domain for now (no verification needed)
// For production, verify your domain at https://resend.com/domains and use your own domain
const EMAIL_FROM = process.env.EMAIL_FROM || 'Chapiz <onboarding@resend.dev>';

// Fallback email for admin notifications (when domain not verified)
const ADMIN_FALLBACK_EMAIL = process.env.ADMIN_FALLBACK_EMAIL || 'polskoydm@gmail.com';

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
      
      // Provide helpful error message for domain verification issues
      let errorMessage = result.error.message || 'Failed to send email';
      if (result.error.message?.includes('domain is not verified')) {
        errorMessage = 'Domain not verified. Please verify your domain at https://resend.com/domains. For testing, you can only send to your verified email address.';
      } else if (result.error.message?.includes('testing emails')) {
        errorMessage = 'You can only send test emails to your verified email address. Please verify your domain at https://resend.com/domains to send to other recipients.';
      }
      
      return {
        success: false,
        error: errorMessage
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
    subject: 'Verify your email address - Chapiz',
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
    subject: 'Reset your password - Chapiz',
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
    subject: 'Confirm your new email address - Chapiz',
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
    subject: 'Your password has been changed - Chapiz',
    react: PasswordChangeNotificationContent({
      userFirstname
    })
  });
}

/**
 * Send account created email with password
 */
export async function sendAccountCreatedEmail(
  email: string,
  userFirstname: string,
  password: string,
  language: 'en' | 'he' = 'en'
): Promise<EmailResult> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`;

  const { default: AccountCreatedEmailContent } = await import(
    '../../emails/account-created'
  );

  const subjects = {
    en: 'Your Chapiz account has been created',
    he: 'החשבון שלך ב-Chapiz נוצר'
  };

  return sendEmail({
    to: email,
    subject: subjects[language],
    react: AccountCreatedEmailContent({
      userFirstname,
      email,
      password,
      loginUrl,
      language
    })
  });
}

/**
 * Send user invitation email with fallback to admin email
 */
export async function sendUserInvitationEmail(
  email: string,
  userFirstname: string,
  language: 'en' | 'he' = 'en'
): Promise<EmailResult> {
  const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signup?email=${encodeURIComponent(email)}`;

  const { default: UserInvitationEmailContent } = await import(
    '../../emails/user-invitation'
  );

  const subjects = {
    en: 'You\'re invited to join Chapiz',
    he: 'הוזמנת להצטרף ל-Chapiz'
  };

  // Try to send to the intended recipient
  const result = await sendEmail({
    to: email,
    subject: subjects[language],
    react: UserInvitationEmailContent({
      userFirstname,
      email,
      signupUrl,
      language
    })
  });

  // If sending fails due to domain verification, send to admin email as fallback
  if (!result.success && (
    result.error?.includes('domain is not verified') ||
    result.error?.includes('testing emails') ||
    result.error?.includes('only send')
  )) {
    console.log('⚠️ Sending invitation to admin email as fallback:', ADMIN_FALLBACK_EMAIL);
    
    // Send to admin email with notification that it's a fallback
    const fallbackResult = await sendEmail({
      to: ADMIN_FALLBACK_EMAIL,
      subject: `[Fallback] Invitation for ${email} - ${subjects[language]}`,
      react: UserInvitationEmailContent({
        userFirstname,
        email,
        signupUrl,
        language
      })
    });

    if (fallbackResult.success) {
      return {
        success: true,
        messageId: fallbackResult.messageId,
        error: `Email sent to admin fallback (${ADMIN_FALLBACK_EMAIL}) because domain is not verified. Original recipient: ${email}`
      };
    }
  }

  return result;
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
