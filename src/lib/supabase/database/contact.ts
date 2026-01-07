import { supabase } from '../client';

export interface ContactSubmission {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    created_at?: string;
}

/**
 * Create a contact submission
 */
export async function createContactSubmission(data: Omit<ContactSubmission, 'id' | 'created_at'>): Promise<ContactSubmission | null> {
    try {
        const { data: submission, error } = await supabase
            .from('contact_submissions')
            .insert({
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                message: data.message
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating contact submission:', error);
            return null;
        }

        return submission;
    } catch (error) {
        console.error('Error in createContactSubmission:', error);
        return null;
    }
}

/**
 * Get all contact submissions (admin only)
 */
export async function getAllContactSubmissions(): Promise<ContactSubmission[]> {
    try {
        const { data, error } = await supabase
            .from('contact_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching contact submissions:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getAllContactSubmissions:', error);
        return [];
    }
}
