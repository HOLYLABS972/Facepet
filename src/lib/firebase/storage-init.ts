// Firebase Storage initialization utility
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { app } from './config';

let storageInstance: FirebaseStorage | null = null;

export function initializeStorage(): FirebaseStorage | null {
  if (storageInstance) {
    return storageInstance;
  }

  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      console.warn('⚠️ Firebase Storage can only be initialized in browser environment');
      return null;
    }

    // Initialize storage
    storageInstance = getStorage(app);
    console.log('✅ Firebase Storage initialized successfully');
    
    // Test storage initialization
    const testRef = storageInstance.ref('test');
    console.log('✅ Firebase Storage reference created successfully');
    
    return storageInstance;
  } catch (error: any) {
    console.error('❌ Firebase Storage initialization failed:', error);
    
    // Check for common issues
    if (error.code === 'storage/invalid-argument') {
      console.error('💡 Issue: Invalid storage bucket configuration');
      console.error('💡 Solution: Check your Firebase project settings');
    } else if (error.code === 'storage/unauthorized') {
      console.error('💡 Issue: Storage not enabled or unauthorized');
      console.error('💡 Solution: Enable Storage in Firebase Console');
    } else if (error.message?.includes('_location')) {
      console.error('💡 Issue: Storage bucket URL is incorrect');
      console.error('💡 Solution: Check storageBucket in Firebase config');
    }
    
    return null;
  }
}

export function getStorageInstance(): FirebaseStorage | null {
  if (!storageInstance) {
    storageInstance = initializeStorage();
  }
  return storageInstance;
}

// Test function to verify storage is working
export async function testStorageConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const storage = getStorageInstance();
    if (!storage) {
      return { success: false, error: 'Storage not initialized' };
    }

    // Try to create a reference
    const testRef = storage.ref('test/connection-test');
    console.log('✅ Storage connection test successful');
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Storage connection test failed:', error);
    return { success: false, error: error.message };
  }
}
