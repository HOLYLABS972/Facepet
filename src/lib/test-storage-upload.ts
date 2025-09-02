// Test file to debug Firebase Storage upload issues
import { storage } from './firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function testStorageUpload() {
  console.log('Testing Firebase Storage upload...');
  
  try {
    // Check if storage is properly initialized
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }
    
    console.log('✅ Firebase Storage is initialized');
    
    // Create a simple test file
    const testContent = 'Hello, Firebase Storage!';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    // Create a reference to the test file
    const testRef = ref(storage, 'test/test-file.txt');
    
    console.log('📤 Uploading test file...');
    
    // Upload the file
    const snapshot = await uploadBytes(testRef, testFile);
    console.log('✅ File uploaded successfully:', snapshot.metadata.name);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Download URL:', downloadURL);
    
    return { success: true, downloadURL };
    
  } catch (error: any) {
    console.error('❌ Storage upload test failed:', error);
    
    // Check for common issues
    if (error.code === 'storage/unauthorized') {
      console.error('🔒 Issue: Storage rules are blocking the upload');
      console.error('💡 Solution: Deploy the storage rules using: ./scripts/deploy-storage-rules.sh');
    } else if (error.code === 'storage/object-not-found') {
      console.error('🔍 Issue: Storage bucket not found');
      console.error('💡 Solution: Check your Firebase project configuration');
    } else if (error.code === 'storage/quota-exceeded') {
      console.error('💾 Issue: Storage quota exceeded');
      console.error('💡 Solution: Check your Firebase Storage usage');
    }
    
    return { success: false, error: error.message };
  }
}

// How to use this test:
/*
1. Open browser console on your app
2. Run: testStorageUpload()
3. Check the console output for any issues
4. If you see "Storage rules are blocking the upload", run the deploy script
*/
