import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In production, use Redis or a database for this
// For now, using a simple in-memory store (will reset on server restart)
const tempSignupStore = new Map<string, { email: string; password: string; fullName: string; expires: number }>();

// Clean up expired entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tempSignupStore.entries()) {
    if (value.expires < now) {
      tempSignupStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // 1 hour

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Generate a temporary token
    const token = uuidv4();
    const expires = Date.now() + (15 * 60 * 1000); // 15 minutes

    // Store the signup data temporarily
    tempSignupStore.set(token, {
      email,
      password,
      fullName,
      expires
    });

    return NextResponse.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Temp signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create temporary signup' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const signupData = tempSignupStore.get(token);

    if (!signupData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    if (signupData.expires < Date.now()) {
      tempSignupStore.delete(token);
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 410 }
      );
    }

    // Return the signup data and delete the token (one-time use)
    tempSignupStore.delete(token);

    return NextResponse.json({
      success: true,
      email: signupData.email,
      password: signupData.password,
      fullName: signupData.fullName
    });

  } catch (error) {
    console.error('Get temp signup error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve signup data' },
      { status: 500 }
    );
  }
}
