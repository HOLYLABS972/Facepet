/**
 * Holy Labs Email Service Integration
 * API Documentation: https://smtp.theholylabs.com/api/email/send
 */

export interface HolyLabsEmailResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface HolyLabsEmailOptions {
  email: string;
  projectId: string;
  templateId: string;
  userName: string;
  otpCode: string;
}

// Configuration - these should be moved to environment variables
const HOLY_LABS_CONFIG = {
  baseUrl: 'https://smtp.theholylabs.com/api/email/send',
  projectId: 'Y0XohJn9DB71FDkTGAke', // This should come from env vars
  templateId: 'zXnn8XNiQu0IifDRg63J', // This should come from env vars
  deletionTemplateId: 'zXnn8XNiQu0IifDRg63J', // Same template for now, can be changed later
};

/**
 * Send verification email using Holy Labs API
 */
export async function sendVerificationEmailViaHolyLabs(
  email: string,
  otpCode: string,
  userName: string = 'User'
): Promise<HolyLabsEmailResult> {
  try {
    const params = new URLSearchParams({
      email: email,
      project_id: HOLY_LABS_CONFIG.projectId,
      template_id: HOLY_LABS_CONFIG.templateId,
      user_name: userName,
      otp_code: otpCode
    });

    const url = `${HOLY_LABS_CONFIG.baseUrl}?${params.toString()}`;
    
    console.log('Sending verification email via Holy Labs:', { email, otpCode, userName });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('Verification email sent successfully via Holy Labs');
      return {
        success: true,
        message: data.message || 'Verification email sent successfully'
      };
    } else {
      console.error('Holy Labs API error:', data);
      return {
        success: false,
        message: data.message || 'Failed to send verification email',
        error: data.error
      };
    }
  } catch (error: any) {
    console.error('Holy Labs email sending error:', error);
    return {
      success: false,
      message: 'Failed to send verification email',
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Send verification email with fallback to original system
 */
export async function sendVerificationEmailWithFallback(
  email: string,
  otpCode: string,
  userName: string = 'User'
): Promise<HolyLabsEmailResult> {
  try {
    // Try Holy Labs API first
    const result = await sendVerificationEmailViaHolyLabs(email, otpCode, userName);
    
    if (result.success) {
      return result;
    }
    
    // If Holy Labs fails, we could fallback to the original system
    // For now, we'll just return the error
    console.warn('Holy Labs API failed, no fallback implemented:', result);
    return result;
    
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: 'Failed to send verification email',
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Send deletion verification email using Holy Labs API
 */
export async function sendDeletionVerificationEmailViaHolyLabs(
  email: string,
  otpCode: string,
  userName: string = 'User'
): Promise<HolyLabsEmailResult> {
  try {
    const params = new URLSearchParams({
      email: email,
      project_id: HOLY_LABS_CONFIG.projectId,
      template_id: HOLY_LABS_CONFIG.deletionTemplateId,
      user_name: userName,
      otp_code: otpCode
    });

    const url = `${HOLY_LABS_CONFIG.baseUrl}?${params.toString()}`;
    
    console.log('Sending deletion verification email via Holy Labs:', { email, otpCode, userName });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('Deletion verification email sent successfully via Holy Labs');
      return {
        success: true,
        message: data.message || 'Deletion verification email sent successfully'
      };
    } else {
      console.error('Holy Labs API error:', data);
      return {
        success: false,
        message: data.message || 'Failed to send deletion verification email',
        error: data.error
      };
    }
  } catch (error: any) {
    console.error('Holy Labs deletion email sending error:', error);
    return {
      success: false,
      message: 'Failed to send deletion verification email',
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Send deletion verification email with fallback to original system
 */
export async function sendDeletionVerificationEmailWithFallback(
  email: string,
  otpCode: string,
  userName: string = 'User'
): Promise<HolyLabsEmailResult> {
  try {
    // Try Holy Labs API first
    const result = await sendDeletionVerificationEmailViaHolyLabs(email, otpCode, userName);
    
    if (result.success) {
      return result;
    }
    
    // If Holy Labs fails, we could fallback to the original system
    // For now, we'll just return the error
    console.warn('Holy Labs deletion API failed, no fallback implemented:', result);
    return result;
    
  } catch (error: any) {
    console.error('Deletion email sending error:', error);
    return {
      success: false,
      message: 'Failed to send deletion verification email',
      error: error.message || 'Unknown error occurred'
    };
  }
}
