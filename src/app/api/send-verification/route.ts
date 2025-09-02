import { NextRequest, NextResponse } from 'next/server';
import { verificationStore } from '@/src/lib/verification-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Call your OTP service
    const response = await fetch(`https://api.theholylabs.com/global_auth?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OTP service error: ${response.status}`);
    }

    const data = await response.json();

    // Store the verification code temporarily (expires in 10 minutes)
    verificationStore.set(email, data.verification_code, 10);

    return NextResponse.json({
      success: true,
      message: data.message,
      verification_code: data.verification_code
    });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
