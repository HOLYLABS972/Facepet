import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin with proper error handling
let adminApp;
let adminDb;
let adminAuth;

try {
  // Check if Firebase Admin is already initialized
  adminApp = getApps().length === 0 ? initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || "facepet-48b13",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  }) : getApps()[0];

  // Initialize Firebase Admin services
  adminDb = getFirestore(adminApp);
  adminAuth = getAuth(adminApp);
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  
  // Fallback: Initialize without credentials (for development)
  if (process.env.NODE_ENV === 'development') {
    console.warn('Initializing Firebase Admin without credentials for development');
    adminApp = getApps().length === 0 ? initializeApp() : getApps()[0];
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
  } else {
    throw new Error('Firebase Admin credentials are required for production');
  }
}

export { adminDb, adminAuth };
export default adminApp;
