import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminApp;
let adminDb;
let adminAuth;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'facepet-48b13';
  
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // Use service account credentials if available
    adminApp = getApps().length === 0 ? initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId,
    }) : getApps()[0];
  } else {
    // Use default credentials (for local development)
    adminApp = getApps().length === 0 ? initializeApp({
      projectId,
    }) : getApps()[0];
  }

  adminDb = getFirestore(adminApp);
  adminAuth = getAuth(adminApp);
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error);
  // Create a mock adminDb for development
  adminDb = null;
  adminAuth = null;
}

export { adminDb, adminAuth };
export default adminApp;
