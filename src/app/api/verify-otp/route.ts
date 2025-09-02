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

    // Verify the code with the external OTP API
    try {
      const verifyResponse = await fetch(`https://api.theholylabs.com/global_auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: code
        })
      });

      if (!verifyResponse.ok) {
        return NextResponse.json({
          success: false,
          error: 'Invalid verification code'
        }, { status: 400 });
      }

      const verifyData = await verifyResponse.json();
      
      if (verifyData.verified) {
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
    } catch (verifyError) {
      console.error('External verification API error:', verifyError);
      return NextResponse.json({
        success: false,
        error: 'Verification service temporarily unavailable'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
