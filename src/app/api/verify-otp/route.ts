import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Call your OTP verification service
    // Note: You'll need to implement the actual verification endpoint
    // For now, we'll simulate verification by checking if the code is 6 digits
    if (code.length === 6 && /^\d{6}$/.test(code)) {
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
