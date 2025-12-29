import { NextRequest, NextResponse } from 'next/server';
import { sendAccountCreatedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, password, language } = body;

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, full name, and password are required' },
        { status: 400 }
      );
    }

    const userFirstname = fullName.split(' ')[0] || fullName;
    const userLanguage = language || 'en';

    const result = await sendAccountCreatedEmail(email, userFirstname, password, userLanguage);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send welcome email'
      },
      { status: 500 }
    );
  }
}

