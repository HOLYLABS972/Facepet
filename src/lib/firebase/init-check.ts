// Firebase initialization check utility
import { storage, auth, db } from './config';

export function checkFirebaseInitialization() {
  const issues: string[] = [];
  
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    issues.push('Not in browser environment');
    return { success: false, issues };
  }
  
  // Check Firebase Storage
  if (!storage) {
    issues.push('Firebase Storage is not initialized');
  } else {
    // Simple check - just verify storage object exists and has expected properties
    try {
      if (typeof storage !== 'object' || !storage.app) {
        issues.push('Firebase Storage object is invalid');
      }
    } catch (error) {
      issues.push(`Firebase Storage error: ${error}`);
    }
  }
  
  // Check Firebase Auth
  if (!auth) {
    issues.push('Firebase Auth is not initialized');
  }
  
  // Check Firestore
  if (!db) {
    issues.push('Firestore is not initialized');
  }
  
  return {
    success: issues.length === 0,
    issues,
    storage: !!storage,
    auth: !!auth,
    db: !!db
  };
}

// Debug function to log Firebase status
export function debugFirebaseStatus() {
  const status = checkFirebaseInitialization();
  
  console.log('🔍 Firebase Initialization Status:');
  console.log('✅ Success:', status.success);
  console.log('📦 Storage:', status.storage ? '✅' : '❌');
  console.log('🔐 Auth:', status.auth ? '✅' : '❌');
  console.log('🗄️ Firestore:', status.db ? '✅' : '❌');
  
  if (status.issues.length > 0) {
    console.log('❌ Issues found:');
    status.issues.forEach(issue => console.log('  -', issue));
  }
  
  return status;
}
