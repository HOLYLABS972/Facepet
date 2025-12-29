import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminApp;
let adminDb;
let adminAuth;
let initializationError: string | null = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'facepet-48b13';
  
  // Check if credentials are available
  const hasCredentials = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
  
  if (!hasCredentials) {
    initializationError = 'Firebase Admin SDK credentials are missing. Please set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables.';
    console.error('❌', initializationError);
    console.error('💡 To fix this:');
    console.error('   1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('   2. Generate a new private key');
    console.error('   3. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to your .env.local file');
    adminDb = null;
    adminAuth = null;
  } else {
    // Use service account credentials
    adminApp = getApps().length === 0 ? initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
      projectId,
    }) : getApps()[0];

    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    console.log('✅ Firebase Admin SDK initialized successfully');
  }
} catch (error: any) {
  initializationError = error.message || 'Failed to initialize Firebase Admin SDK';
  console.error('❌ Firebase Admin SDK initialization failed:', error);
  console.error('💡 Make sure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set correctly in your .env.local file');
  adminDb = null;
  adminAuth = null;
}

export { adminDb, adminAuth, initializationError };
export default adminApp;
