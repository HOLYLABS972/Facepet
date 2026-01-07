import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('Attempting to send password reset email to:', email);

    // Send password reset email using Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.error('Error sending password reset email:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('Password reset email sent successfully to:', email);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error: any) {
    console.error('Error sending password reset email:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}



