import { supabase } from './client';

/**
 * Upload a pet image to Supabase Storage
 */
export async function uploadPetImage(file: File, petId: string): Promise<string> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${petId}-${Date.now()}.${fileExt}`;
        const filePath = `pets/${fileName}`;

        const { data, error } = await supabase.storage
            .from('pet-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Error uploading pet image:', error);
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('pet-images')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error in uploadPetImage:', error);
        throw error;
    }
}

/**
 * Upload a profile image to Supabase Storage
 */
export async function uploadProfileImage(file: File, userId: string): Promise<string> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        const { data, error } = await supabase.storage
            .from('profile-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Error uploading profile image:', error);
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error in uploadProfileImage:', error);
        throw error;
    }
}

/**
 * Test storage connection
 */
export async function testStorageConnection(): Promise<boolean> {
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Storage connection test failed:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Storage connection test error:', error);
        return false;
    }
}

/**
 * Delete a pet image from Supabase Storage
 */
export async function deletePetImage(imageUrl: string): Promise<boolean> {
    try {
        // Extract the file path from the URL
        const urlParts = imageUrl.split('/');
        const filePath = `pets/${urlParts[urlParts.length - 1]}`;

        const { error } = await supabase.storage
            .from('pet-images')
            .remove([filePath]);

        if (error) {
            console.error('Error deleting pet image:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deletePetImage:', error);
        return false;
    }
}

/**
 * Delete a profile image from Supabase Storage
 */
export async function deleteProfileImage(imageUrl: string): Promise<boolean> {
    try {
        // Extract the file path from the URL
        const urlParts = imageUrl.split('/');
        const filePath = `profiles/${urlParts[urlParts.length - 1]}`;

        const { error } = await supabase.storage
            .from('profile-images')
            .remove([filePath]);

        if (error) {
            console.error('Error deleting profile image:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteProfileImage:', error);
        return false;
    }
}
