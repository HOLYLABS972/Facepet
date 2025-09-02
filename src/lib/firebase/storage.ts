import { storage } from './config';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { User } from 'firebase/auth';

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  downloadURL?: string;
}

export async function uploadProfileImage(
  file: File,
  user: User,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ success: boolean; downloadURL?: string; error?: string }> {
  try {
    if (!user.uid) {
      throw new Error('User ID is required');
    }

    // Create a reference to the file location
    const fileName = `profile-images/${user.uid}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, fileName);

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.({
            progress,
            status: 'uploading'
          });
        },
        (error) => {
          // Handle upload error
          console.error('Upload error:', error);
          onProgress?.({
            progress: 0,
            status: 'error',
            error: error.message
          });
          reject({ success: false, error: error.message });
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.({
              progress: 100,
              status: 'completed',
              downloadURL
            });
            resolve({ success: true, downloadURL });
          } catch (error: any) {
            onProgress?.({
              progress: 0,
              status: 'error',
              error: error.message
            });
            reject({ success: false, error: error.message });
          }
        }
      );
    });
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProfileImage(imageURL: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract the file path from the URL
    const url = new URL(imageURL);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid image URL');
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, filePath);
    
    await deleteObject(imageRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting profile image:', error);
    return { success: false, error: error.message };
  }
}
