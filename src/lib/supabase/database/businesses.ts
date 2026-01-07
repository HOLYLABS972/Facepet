import { supabase } from '../client';

export interface Business {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    created_at: string;
    updated_at: string;
}

// Get all businesses
export async function getAllBusinesses(): Promise<Business[]> {
    const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching businesses:', error);
        return [];
    }

    return data;
}

// Get business by ID
export async function getBusinessById(id: string): Promise<Business | null> {
    const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching business:', error);
        return null;
    }

    return data;
}

// Search businesses
export async function searchBusinesses(searchTerm: string): Promise<Business[]> {
    const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error searching businesses:', error);
        return [];
    }

    return data;
}

// Create business
export async function createBusiness(businessData: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Promise<Business | null> {
    const { data, error } = await supabase
        .from('businesses')
        .insert(businessData)
        .select()
        .single();

    if (error) {
        console.error('Error creating business:', error);
        return null;
    }

    return data;
}

// Update business
export async function updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    const { data, error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating business:', error);
        return null;
    }

    return data;
}

// Delete business
export async function deleteBusiness(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting business:', error);
        return false;
    }

    return true;
}

// Get businesses with pagination
export async function getBusinessesPaginated(page: number = 1, pageSize: number = 20): Promise<{ businesses: Business[], total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
        .from('businesses')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to);

    if (error) {
        console.error('Error fetching businesses:', error);
        return { businesses: [], total: 0 };
    }

    return { businesses: data, total: count || 0 };
}
