import { supabase } from '../client';

/**
 * Add points to user by UID (server-side - placeholder)
 */
export async function addPointsToUserByUid(userId: string, points: number, category?: string): Promise<boolean> {
    // TODO: Implement with actual Supabase schema
    console.warn('addPointsToUserByUid not yet fully implemented');
    return false;
}
