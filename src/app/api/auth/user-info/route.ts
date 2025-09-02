import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/database/drizzle';
import { users } from '@/utils/database/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();

    // Get user from database
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        emailVerified: users.emailVerified
      })
      .from(users)
      .where(eq(users.email, emailLower))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: user[0]
    });

  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    );
  }
}
