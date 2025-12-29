import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, initializationError } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Check if Admin SDK is initialized
    if (initializationError || !adminAuth) {
      return NextResponse.json(
        {
          success: false,
          error: initializationError || 'Firebase Admin SDK is not initialized. Please check your Firebase Admin SDK configuration.',
          details: 'Make sure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set in your .env.local file'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fullName, email, phone, password, role = 'user' } = body;

    // Validate inputs
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists in Firebase Auth
    try {
      await adminAuth.getUserByEmail(emailLower);
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    } catch (error: any) {
      // User doesn't exist, which is what we want
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create Firebase Authentication user
    const userRecord = await adminAuth.createUser({
      email: emailLower,
      password: password,
      displayName: fullName,
      emailVerified: false, // Admin-created users need to verify email
      disabled: false
    });

    // Create Firestore user document
    const userData = {
      uid: userRecord.uid,
      email: emailLower,
      displayName: fullName,
      fullName: fullName,
      phone: phone || '',
      role: role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      emailVerified: false,
      acceptCookies: false,
      language: 'en'
    };

    await setDoc(doc(db, 'users', userRecord.uid), userData);

    console.log('✅ User created successfully:', {
      uid: userRecord.uid,
      email: emailLower,
      role: role
    });

    return NextResponse.json({
      success: true,
      userId: userRecord.uid
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { success: false, error: 'Password is too weak' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create user. Please try again.'
      },
      { status: 500 }
    );
  }
}

