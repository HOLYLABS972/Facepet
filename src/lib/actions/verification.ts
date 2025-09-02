'use server';

/**
 * Generates a verification code using the external OTP API
 * 
 * @param email - The email address of the user.
 * @returns An object indicating success or failure with the verification code.
 */
export async function generateVerificationCode(
  email: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    // Send the verification code via external OTP API
    const otpResponse = await fetch(`https://api.theholylabs.com/global_auth?email=${encodeURIComponent(email)}`);
    
    if (!otpResponse.ok) {
      console.error('Failed to send OTP via external API:', otpResponse.statusText);
      return { success: false, error: 'Failed to send verification code' };
    }

    const responseData = await otpResponse.json();
    console.log('OTP API Response:', responseData);

    // The external API sends the code directly to the user's email
    // We return the code for frontend validation
    return { success: true, code: responseData.verification_code };
  } catch (error: any) {
    console.error('Error calling external OTP API:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
}