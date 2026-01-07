import { supabase } from '../client';

export interface Pet {
    id: string;
    name: string;
    description?: string;
    image_url: string;
    gender_id: number;
    breed_id: number;
    birth_date?: string;
    notes?: string;
    user_email: string;
    owner_id?: string;
    vet_id?: string;
    created_at: string;
    updated_at: string;
}

export interface Breed {
    id: number;
    en: string;
    he: string;
}

export interface Gender {
    id: number;
    en: string;
    he: string;
}

export interface PetType {
    id: number;
    en: string;
    he: string;
}

// Get all breeds
export async function getAllBreeds(): Promise<Breed[]> {
    const { data, error } = await supabase
        .from('breeds')
        .select('*')
        .order('en', { ascending: true });

    if (error) {
        console.error('Error fetching breeds:', error);
        return [];
    }

    return data;
}

// Get all genders
export async function getAllGenders(): Promise<Gender[]> {
    const { data, error } = await supabase
        .from('genders')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching genders:', error);
        return [];
    }

    return data;
}

// Get all pet types
export async function getAllPetTypes(): Promise<PetType[]> {
    const { data, error } = await supabase
        .from('pet_types')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching pet types:', error);
        return [];
    }

    return data;
}

// Get pets by user email
export async function getPetsByUserEmail(email: string): Promise<Pet[]> {
    const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching pets:', error);
        return [];
    }

    return data;
}

// Get pet by ID
export async function getPetById(id: string): Promise<Pet | null>;
export async function getPetById(id: string, withResult: true): Promise<{ success: boolean; pet?: Pet; error?: string }>;
export async function getPetById(id: string, withResult?: boolean): Promise<Pet | null | { success: boolean; pet?: Pet; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('pets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching pet:', error);
            if (withResult) {
                return { success: false, error: error.message };
            }
            return null;
        }

        if (withResult) {
            return { success: true, pet: data };
        }
        return data;
    } catch (error) {
        console.error('Error in getPetById:', error);
        if (withResult) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
        return null;
    }
}

// Create pet
export async function createPet(petData: Omit<Pet, 'id' | 'created_at' | 'updated_at'>): Promise<Pet | null> {
    const { data, error } = await supabase
        .from('pets')
        .insert(petData)
        .select()
        .single();

    if (error) {
        console.error('Error creating pet:', error);
        return null;
    }

    return data;
}

// Update pet
export async function updatePet(id: string, updates: Partial<Pet>): Promise<Pet | null> {
    const { data, error } = await supabase
        .from('pets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating pet:', error);
        return null;
    }

    return data;
}

// Delete pet
export async function deletePet(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting pet:', error);
        return false;
    }

    return true;
}

// Get pet with related data (breed, gender)
export async function getPetWithDetails(id: string) {
    const { data, error } = await supabase
        .from('pets')
        .select(`
      *,
      breeds (en, he),
      genders (en, he)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching pet with details:', error);
        return null;
    }

    return data;
}

// Get all pets with details
export async function getAllPetsWithDetails() {
    const { data, error } = await supabase
        .from('pets')
        .select(`
      *,
      breeds (en, he),
      genders (en, he)
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching pets with details:', error);
        return [];
    }

    return data;
}

// Helper functions for dropdown data (compatible with old Firebase functions)
export async function getBreedsForDropdown(locale: string = 'en'): Promise<Array<{ value: string; label: string }>> {
    const breeds = await getAllBreeds();
    return breeds.map(breed => ({
        value: breed.id.toString(),
        label: locale === 'he' ? breed.he : breed.en
    }));
}

export async function getGendersForDropdown(locale: string = 'en'): Promise<Array<{ value: string; label: string }>> {
    const genders = await getAllGenders();
    return genders.map(gender => ({
        value: gender.id.toString(),
        label: locale === 'he' ? gender.he : gender.en
    }));
}

export async function getPetTypesForDropdown(locale: string = 'en'): Promise<Array<{ value: string; label: string }>> {
    const types = await getAllPetTypes();
    return types.map(type => ({
        value: type.id.toString(),
        label: locale === 'he' ? type.he : type.en
    }));
}

// Get breed name by ID (compatible with old Firebase function)
export async function getBreedNameById(breedId: number | string, locale: string = 'en'): Promise<string> {
    const breeds = await getAllBreeds();
    const breed = breeds.find(b => b.id === Number(breedId));
    if (!breed) return 'Unknown';
    return locale === 'he' ? breed.he : breed.en;
}

// Placeholder helper functions for dropdown data (to be implemented with actual data)
export async function getAreasForDropdown(locale: string = 'en'): Promise<Array<{ value: string; label: string }>> {
    // TODO: Implement areas lookup from Supabase
    return [];
}

export async function getCitiesForDropdown(locale: string = 'en'): Promise<Array<{ value: string; label: string }>> {
    // TODO: Implement cities lookup from Supabase
    return [];
}

export async function getAgeRangesForDropdown(locale: string = 'en'): Promise<Array<{ value: string; label: string }>> {
    // TODO: Implement age ranges
    return [
        { value: '0-1', label: locale === 'he' ? '0-1 שנים' : '0-1 years' },
        { value: '1-3', label: locale === 'he' ? '1-3 שנים' : '1-3 years' },
        { value: '3-7', label: locale === 'he' ? '3-7 שנים' : '3-7 years' },
        { value: '7+', label: locale === 'he' ? '7+ שנים' : '7+ years' }
    ];
}

export async function getWeightRangesForDropdown(locale: string = 'en'): Promise<Array<{ value: string; label: string }>> {
    // TODO: Implement weight ranges
    return [
        { value: '0-5', label: locale === 'he' ? '0-5 ק"ג' : '0-5 kg' },
        { value: '5-15', label: locale === 'he' ? '5-15 ק"ג' : '5-15 kg' },
        { value: '15-30', label: locale === 'he' ? '15-30 ק"ג' : '15-30 kg' },
        { value: '30+', label: locale === 'he' ? '30+ ק"ג' : '30+ kg' }
    ];
}

// Compatible wrapper for updatePet (matches Firebase function signature)
export async function updatePetInFirestore(id: string, updates: any): Promise<{ success: boolean; error?: string }> {
    try {
        const result = await updatePet(id, updates);
        if (result) {
            return { success: true };
        }
        return { success: false, error: 'Failed to update pet' };
    } catch (error) {
        console.error('Error updating pet:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Compatible wrapper for createPet (matches Firebase function signature)
export async function createPetInFirestore(petData: any): Promise<{ success: boolean; petId?: string; error?: string }> {
    try {
        const result = await createPet(petData);
        if (result) {
            return { success: true, petId: result.id };
        }
        return { success: false, error: 'Failed to create pet' };
    } catch (error) {
        console.error('Error creating pet:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Get pet by ID from Firestore (compatible name with result wrapper)
export async function getPetByIdFromFirestore(id: string): Promise<{ success: boolean; pet?: Pet; error?: string }> {
    try {
        const pet = await getPetById(id);
        if (pet) {
            return { success: true, pet };
        }
        return { success: false, error: 'Pet not found' };
    } catch (error) {
        console.error('Error getting pet:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Get pet with owner (consolidated function)
export async function getPetWithConsolidatedOwner(id: string): Promise<{
    success: boolean;
    pet?: any;
    owner?: any;
    vet?: any;
    error?: string;
}> {
    try {
        const petData = await getPetWithDetails(id);
        if (!petData) {
            return { success: false, error: 'Pet not found' };
        }

        // Get owner data if owner_id exists
        let owner = null;
        if (petData.owner_id) {
            const { getUserById } = await import('./users');
            owner = await getUserById(petData.owner_id);
        }

        // Get vet data if vet_id exists
        let vet = null;
        if (petData.vet_id) {
            // TODO: Implement vet lookup if needed
        }

        return {
            success: true,
            pet: petData,
            owner,
            vet
        };
    } catch (error) {
        console.error('Error getting pet with consolidated owner:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
