'use client';

import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

/**
 * Send invitation email to a new user (for admin use)
 * This function simply sends an invitation email without creating the user account.
 * The user will sign up themselves when they click the link in the email.
 */
export async function sendUserInvitationByAdmin(
  fullName: string,
  email: string,
  phone: string,
  role: 'user' | 'admin' | 'super_admin' = 'user'
): Promise<{ success: boolean; error?: string; warning?: string }> {
  try {
    const emailLower = email.toLowerCase().trim();

    // Validate inputs
    if (!emailLower || !fullName) {
      return { success: false, error: 'Email and full name are required' };
    }

    // Get current admin user info (just to verify admin is signed in)
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return { success: false, error: 'Admin must be signed in to send invitations' };
    }

    // Check if user already exists
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, emailLower);
      if (signInMethods.length > 0) {
        return { success: false, error: 'User with this email already exists' };
      }
    } catch (error: any) {
      // If there's an error checking, continue anyway
      console.warn('Could not check if email exists:', error);
    }

    // Default language is 'en', but can be changed later by the user
    const userLanguage: 'en' | 'he' = 'en';

    // Send invitation email
    try {
      const emailResponse = await fetch('/api/admin/users/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailLower,
          fullName: fullName,
          language: userLanguage
        })
      });

      // Check if response is OK and is JSON
      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('⚠️ API error response:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          return { 
            success: false, 
            error: errorJson.error || 'Failed to send invitation email' 
          };
        } catch {
          return { 
            success: false, 
            error: `Server error: ${emailResponse.status} ${emailResponse.statusText}` 
          };
        }
      }

      // Check content type to ensure it's JSON
      const contentType = emailResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await emailResponse.text();
        console.error('⚠️ Non-JSON response:', text.substring(0, 200));
        return { 
          success: false, 
          error: 'Server returned an invalid response. Please try again.' 
        };
      }

      const emailResult = await emailResponse.json();
      if (emailResult.success) {
        if (emailResult.warning) {
          console.log('⚠️', emailResult.warning);
          // Still return success, but with a note about fallback
          return { 
            success: true,
            warning: emailResult.warning
          };
        }
        console.log('✅ Invitation email sent to:', emailLower);
        return { success: true };
      } else {
        console.error('⚠️ Failed to send invitation email:', emailResult.error);
        return { 
          success: false, 
          error: emailResult.error || 'Failed to send invitation email' 
        };
      }
    } catch (emailError: any) {
      console.error('⚠️ Failed to send invitation email:', emailError);
      return { 
        success: false, 
        error: emailError.message || 'Failed to send invitation email. Please try again.' 
      };
    }
  } catch (error: any) {
    console.error('Unexpected error sending invitation:', error);

    // Handle specific errors
    if (error.code === 'auth/invalid-email') {
      return { 
        success: false, 
        error: 'Invalid email address'
      };
    }

    // Return generic error
    const errorMessage = error?.message || error?.errorInfo?.message || 'Failed to send invitation. Please try again.';
    return {
      success: false,
      error: errorMessage
    };
  }
}

