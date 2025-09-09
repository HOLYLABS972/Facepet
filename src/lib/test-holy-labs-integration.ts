/**
 * Test script for Holy Labs email integration
 * Run this to test the new email verification system
 */

import { generateOTPCode } from './otp-generator';
import { sendVerificationEmailViaHolyLabs } from './holy-labs-email';

export async function testHolyLabsIntegration() {
  console.log('🧪 Testing Holy Labs Email Integration...');
  
  try {
    // Generate a test OTP code
    const testOTP = generateOTPCode();
    console.log('Generated OTP Code:', testOTP);
    
    // Test email (replace with your test email)
    const testEmail = 'test@example.com';
    const testUserName = 'Test User';
    
    console.log('Sending test email to:', testEmail);
    
    // Send test email
    const result = await sendVerificationEmailViaHolyLabs(
      testEmail,
      testOTP,
      testUserName
    );
    
    console.log('Email sending result:', result);
    
    if (result.success) {
      console.log('✅ Test successful! Email sent via Holy Labs API');
    } else {
      console.log('❌ Test failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test error:', error);
    return {
      success: false,
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Uncomment the line below to run the test
// testHolyLabsIntegration();
