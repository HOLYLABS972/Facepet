import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email, fullName, language } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    const userFirstname = fullName.split(' ')[0] || fullName;
    const userLanguage = language || 'en';

    // Import email function dynamically to catch import errors
    let sendUserInvitationEmail;
    try {
      const emailModule = await import('@/lib/email');
      sendUserInvitationEmail = emailModule.sendUserInvitationEmail;
    } catch (importError: any) {
      console.error('Failed to import email module:', importError);
      return NextResponse.json(
        { success: false, error: 'Failed to load email service' },
        { status: 500 }
      );
    }

    const result = await sendUserInvitationEmail(email, userFirstname, userLanguage);

    // If result has an error message but success is true, it means it was sent to fallback
    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        warning: result.error // Include warning if sent to fallback
      });
    }

    // If it failed completely
    return NextResponse.json(
      { success: false, error: result.error || 'Failed to send invitation email' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error sending invitation email:', error);
    // Ensure we always return JSON, even on unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to send invitation email'
      },
      { status: 500 }
    );
  }
}

