import { supabase } from '../client';

export interface User {
    id: string;
    uid: string;
    email: string;
    full_name: string;
    display_name?: string;
    phone?: string;
    role: 'user' | 'admin' | 'super_admin';
    email_verified: boolean;
    profile_image?: string;
    address?: string;
    language?: string;
    created_at: string;
    updated_at: string;
    accept_cookies?: boolean;
    is_restricted?: boolean;
    restriction_reason?: string;
    coordinates?: { lat: number; lng: number };
    place_id?: string;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }

    return data;
}

// Get user by Firebase UID
export async function getUserByFirebaseUid(uid: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', uid)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }

    return data;
}

// Get user by Supabase ID
export async function getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }

    return data;
}

// Create or update user
export async function upsertUser(userData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'email' })
        .select()
        .single();

    if (error) {
        console.error('Error upserting user:', error);
        return null;
    }

    return data;
}

// Update user
export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating user:', error);
        return null;
    }

    return data;
}

// Get all users (admin only)
export async function getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return data;
}

// Delete user
export async function deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting user:', error);
        return false;
    }

    return true;
}

// Update user by UID (compatible with old Firebase function)
export async function updateUserByUid(uid: string, updates: {
    displayName?: string;
    phone?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    placeId?: string;
    profileImage?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const updateData: Partial<User> = {};

        if (updates.displayName !== undefined) {
            updateData.display_name = updates.displayName;
            updateData.full_name = updates.displayName;
        }
        if (updates.phone !== undefined) {
            updateData.phone = updates.phone;
        }
        if (updates.address !== undefined) {
            updateData.address = updates.address;
        }
        if (updates.profileImage !== undefined) {
            updateData.profile_image = updates.profileImage;
        }

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('uid', uid)
            .select()
            .single();

        if (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating user:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Get user by UID (compatible with old Firebase function)
export async function getUserByUid(uid: string): Promise<User | null> {
    return getUserByFirebaseUid(uid);
}

// Get user from Firestore (compatible wrapper with result format)
export async function getUserFromFirestore(uid: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        const user = await getUserByFirebaseUid(uid);
        if (user) {
            return { success: true, user };
        }
        return { success: false, error: 'User not found' };
    } catch (error) {
        console.error('Error getting user:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
