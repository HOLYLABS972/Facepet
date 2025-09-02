import { NextRequest, NextResponse } from 'next/server';
import { verificationStore } from '@/src/lib/verification-store';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Get the stored verification code for this email
    const storedData = verificationStore.get(email);

    if (!storedData) {
      return NextResponse.json({
        success: false,
        error: 'No verification code found for this email. Please request a new code.'
      }, { status: 404 });
    }

    // Verify the code
    if (storedData.code === code) {
      // Remove the code after successful verification (one-time use)
      verificationStore.delete(email);
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        verified: true
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid verification code'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
