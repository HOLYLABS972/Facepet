import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/database/drizzle';
import { users } from '@/utils/database/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, phone, password, role = 'user' } = await request.json();

    if (!email || !fullName || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, emailLower))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create user in database
    const newUser = await db.insert(users).values({
      fullName,
      email: emailLower,
      phone,
      password: hashedPassword,
      role: role as 'user' | 'admin' | 'super_admin',
      emailVerified: true, // Since they verified with OTP
      emailVerifiedAt: new Date()
    }).returning();

    return NextResponse.json({
      success: true,
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        fullName: newUser[0].fullName,
        role: newUser[0].role,
        emailVerified: newUser[0].emailVerified
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    );
  }
}
