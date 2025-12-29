// Simple Firebase Storage upload function
import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User } from 'firebase/auth';
import { convertToWebPOptimized } from '@/lib/utils/image-conversion';

export interface UploadResult {
  success: boolean;
  downloadURL?: string;
  error?: string;
}

/**
 * Simple file upload to Firebase Storage
 * @param file - The file to upload
 * @param user - The authenticated user
 * @param folder - The folder to upload to (default: 'uploads')
 * @returns Promise with upload result
 */
export async function uploadFile(
  file: File,
  user: User,
  folder: string = 'uploads',
  shouldConvertToWebP: boolean = true
): Promise<UploadResult> {
  try {
    console.log('🚀 Starting file upload...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: user.uid,
      folder
    });

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    // Check if storage is available
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    // Convert image to WebP if it's an image and conversion is enabled
    let fileToUpload = file;
    if (shouldConvertToWebP && file.type.startsWith('image/') && file.type !== 'image/webp') {
      try {
        console.log('🔄 Converting image to WebP...');
        fileToUpload = await convertToWebPOptimized(file, undefined, 1920, 1920);
        console.log('✅ Image converted to WebP', {
          originalSize: file.size,
          newSize: fileToUpload.size,
          reduction: `${((1 - fileToUpload.size / file.size) * 100).toFixed(1)}%`
        });
      } catch (error) {
        console.warn('⚠️ Failed to convert to WebP, using original file:', error);
        // Continue with original file if conversion fails
      }
    }

    // Create file path
    const timestamp = Date.now();
    const fileName = `${timestamp}-${fileToUpload.name}`;
    const filePath = `${folder}/${user.uid}/${fileName}`;
    
    console.log('📁 File path:', filePath);

    // Create storage reference
    const storageRef = ref(storage, filePath);
    console.log('📤 Uploading to Firebase Storage...');

    // Upload file
    const snapshot = await uploadBytes(storageRef, fileToUpload);
    console.log('✅ Upload successful:', snapshot.metadata.name);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL generated:', downloadURL);

    return {
      success: true,
      downloadURL
    };

  } catch (error: any) {
    console.error('❌ Upload failed:', error);
    
    // Provide helpful error messages
    let errorMessage = error.message || 'Upload failed';
    
    if (error.code === 'storage/unauthorized') {
      errorMessage = 'Storage access denied. Please check your authentication.';
    } else if (error.code === 'storage/object-not-found') {
      errorMessage = 'Storage bucket not found. Please check your Firebase configuration.';
    } else if (error.code === 'storage/quota-exceeded') {
      errorMessage = 'Storage quota exceeded. Please contact support.';
    } else if (error.code === 'storage/invalid-argument') {
      errorMessage = 'Invalid file or configuration. Please try again.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Upload profile image specifically
 */
export async function uploadProfileImage(
  file: File,
  user: User
): Promise<UploadResult> {
  // Validate image file
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'Please select a valid image file'
    };
  }

  // Check file size (5MB limit for original)
  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: 'Image size must be less than 5MB'
    };
  }

  // Convert to WebP with max dimensions for profile images
  return uploadFile(file, user, 'profile-images', true);
}

/**
 * Upload pet image specifically
 */
export async function uploadPetImage(
  file: File,
  user: User
): Promise<UploadResult> {
  // Validate image file
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'Please select a valid image file'
    };
  }

  // Check file size (10MB limit for original)
  if (file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      error: 'Image size must be less than 10MB'
    };
  }

  // Convert to WebP with max dimensions for pet images
  return uploadFile(file, user, 'pet-images', true);
}

/**
 * Test Firebase Storage connection
 */
export async function testStorageConnection(): Promise<UploadResult> {
  try {
    if (!storage) {
      return {
        success: false,
        error: 'Firebase Storage not initialized'
      };
    }

    // Create a test reference
    const testRef = ref(storage, 'test/connection-test');
    console.log('✅ Storage connection test successful');
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('❌ Storage connection test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
