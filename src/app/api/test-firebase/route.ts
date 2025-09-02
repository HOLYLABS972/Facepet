import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDM3nU5ifIk5wF3kcdToVWpjDD6U5VP5Jk",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "facepet-48b13.firebaseapp.com",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "facepet-48b13",
    };

    return NextResponse.json({
      success: true,
      message: 'Firebase configuration loaded',
      config: {
        apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
      }
    });
  } catch (error) {
    console.error('Firebase config test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
