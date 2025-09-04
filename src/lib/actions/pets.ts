'use server';

import { db } from '@/utils/database/drizzle';
import { pets, owners, genders, breeds } from '@/utils/database/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface PetData {
  name: string;
  description?: string;
  imageUrl: string;
  genderId: number;
  breedId: number;
  birthDate?: string;
  notes?: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerAddress: string;
  vetId?: string;
}

export interface Pet {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  genderId: number;
  breedId: number;
  birthDate?: string;
  notes?: string;
  userEmail: string;
  ownerId: string;
  vetId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  genderName?: string;
  breedName?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerAddress?: string;
}

/**
 * Create a new pet
 */
export async function createPet(petData: PetData): Promise<{ success: boolean; petId?: string; error?: string }> {
  try {
    // Note: This function is deprecated - use Firebase client-pets instead
    return { success: false, error: 'This function is deprecated. Use Firebase client-pets instead.' };

    // Create owner first
    const [owner] = await db.insert(owners).values({
      fullName: petData.ownerName,
      phoneNumber: petData.ownerPhone,
      email: petData.ownerEmail,
      homeAddress: petData.ownerAddress,
      isPhonePrivate: false,
      isEmailPrivate: false,
      isAddressPrivate: false
    }).returning();

    // Create pet
    const [pet] = await db.insert(pets).values({
      name: petData.name,
      description: petData.description,
      imageUrl: petData.imageUrl,
      genderId: petData.genderId,
      breedId: petData.breedId,
      birthDate: petData.birthDate,
      notes: petData.notes,
      userEmail: session.user.email,
      ownerId: owner.id,
      vetId: petData.vetId
    }).returning();

    return { success: true, petId: pet.id };
  } catch (error: any) {
    console.error('Create pet error:', error);
    return { success: false, error: 'Failed to create pet' };
  }
}

/**
 * Get all pets for the current user
 */
export async function getUserPets(userEmail: string): Promise<{ success: boolean; pets?: Pet[]; error?: string }> {
  try {
    if (!userEmail) {
      return { success: false, error: 'User email is required' };
    }

    const userPets = await db
      .select({
        id: pets.id,
        name: pets.name,
        description: pets.description,
        imageUrl: pets.imageUrl,
        genderId: pets.genderId,
        breedId: pets.breedId,
        birthDate: pets.birthDate,
        notes: pets.notes,
        userEmail: pets.userEmail,
        ownerId: pets.ownerId,
        vetId: pets.vetId,
        createdAt: pets.createdAt,
        updatedAt: pets.updatedAt,
        genderName: genders.en,
        breedName: breeds.en,
        ownerName: owners.fullName,
        ownerPhone: owners.phoneNumber,
        ownerEmail: owners.email,
        ownerAddress: owners.homeAddress
      })
      .from(pets)
      .leftJoin(genders, eq(pets.genderId, genders.id))
      .leftJoin(breeds, eq(pets.breedId, breeds.id))
      .leftJoin(owners, eq(pets.ownerId, owners.id))
      .where(eq(pets.userEmail, userEmail))
      .orderBy(desc(pets.createdAt));

    return { success: true, pets: userPets };
  } catch (error: any) {
    console.error('Get user pets error:', error);
    return { success: false, error: 'Failed to get pets' };
  }
}

/**
 * Get a specific pet by ID
 */
export async function getPetById(petId: string): Promise<{ success: boolean; pet?: Pet; error?: string }> {
  try {
    // Note: This function is deprecated - use Firebase client-pets instead
    return { success: false, error: 'This function is deprecated. Use Firebase client-pets instead.' };

    const [pet] = await db
      .select({
        id: pets.id,
        name: pets.name,
        description: pets.description,
        imageUrl: pets.imageUrl,
        genderId: pets.genderId,
        breedId: pets.breedId,
        birthDate: pets.birthDate,
        notes: pets.notes,
        userEmail: pets.userEmail,
        ownerId: pets.ownerId,
        vetId: pets.vetId,
        createdAt: pets.createdAt,
        updatedAt: pets.updatedAt,
        genderName: genders.en,
        breedName: breeds.en,
        ownerName: owners.fullName,
        ownerPhone: owners.phoneNumber,
        ownerEmail: owners.email,
        ownerAddress: owners.homeAddress
      })
      .from(pets)
      .leftJoin(genders, eq(pets.genderId, genders.id))
      .leftJoin(breeds, eq(pets.breedId, breeds.id))
      .leftJoin(owners, eq(pets.ownerId, owners.id))
      .where(and(
        eq(pets.id, petId),
        eq(pets.userEmail, session.user.email)
      ))
      .limit(1);

    if (!pet) {
      return { success: false, error: 'Pet not found' };
    }

    return { success: true, pet };
  } catch (error: any) {
    console.error('Get pet by ID error:', error);
    return { success: false, error: 'Failed to get pet' };
  }
}

/**
 * Update a pet
 */
export async function updatePet(petId: string, petData: Partial<PetData>): Promise<{ success: boolean; error?: string }> {
  try {
    // Note: This function is deprecated - use Firebase client-pets instead
    return { success: false, error: 'This function is deprecated. Use Firebase client-pets instead.' };

    // Check if pet exists and belongs to user
    const existingPet = await getPetById(petId);
    if (!existingPet.success || !existingPet.pet) {
      return { success: false, error: 'Pet not found' };
    }

    // Update pet
    await db
      .update(pets)
      .set({
        name: petData.name,
        description: petData.description,
        imageUrl: petData.imageUrl,
        genderId: petData.genderId,
        breedId: petData.breedId,
        birthDate: petData.birthDate,
        notes: petData.notes,
        vetId: petData.vetId,
        updatedAt: new Date()
      })
      .where(and(
        eq(pets.id, petId),
        eq(pets.userEmail, session.user.email)
      ));

    // Update owner if provided
    if (petData.ownerName || petData.ownerPhone || petData.ownerEmail || petData.ownerAddress) {
      await db
        .update(owners)
        .set({
          fullName: petData.ownerName,
          phoneNumber: petData.ownerPhone,
          email: petData.ownerEmail,
          homeAddress: petData.ownerAddress
        })
        .where(eq(owners.id, existingPet.pet.ownerId));
    }

    return { success: true };
  } catch (error: any) {
    console.error('Update pet error:', error);
    return { success: false, error: 'Failed to update pet' };
  }
}

/**
 * Delete a pet
 */
export async function deletePet(petId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Note: This function is deprecated - use Firebase client-pets instead
    return { success: false, error: 'This function is deprecated. Use Firebase client-pets instead.' };

    // Check if pet exists and belongs to user
    const existingPet = await getPetById(petId);
    if (!existingPet.success || !existingPet.pet) {
      return { success: false, error: 'Pet not found' };
    }

    // Delete pet (owner will be deleted due to cascade)
    await db
      .delete(pets)
      .where(and(
        eq(pets.id, petId),
        eq(pets.userEmail, session.user.email)
      ));

    return { success: true };
  } catch (error: any) {
    console.error('Delete pet error:', error);
    return { success: false, error: 'Failed to delete pet' };
  }
}

/**
 * Get all genders
 */
export async function getGenders(): Promise<{ success: boolean; genders?: Array<{ id: number; name: string }>; error?: string }> {
  try {
    const gendersList = await db.select().from(genders);
    return { 
      success: true, 
      genders: gendersList.map(g => ({ id: g.id, name: g.en }))
    };
  } catch (error: any) {
    console.error('Get genders error:', error);
    return { success: false, error: 'Failed to get genders' };
  }
}

/**
 * Get all breeds
 */
export async function getBreeds(): Promise<{ success: boolean; breeds?: Array<{ id: number; name: string }>; error?: string }> {
  try {
    const breedsList = await db.select().from(breeds);
    return { 
      success: true, 
      breeds: breedsList.map(b => ({ id: b.id, name: b.en }))
    };
  } catch (error: any) {
    console.error('Get breeds error:', error);
    return { success: false, error: 'Failed to get breeds' };
  }
}

/**
 * Check if pet ID is available (for pet registration)
 */
export async function checkPetIdAvailability(petId: string): Promise<boolean> {
  try {
    const existingPet = await db
      .select()
      .from(pets)
      .where(eq(pets.id, petId))
      .limit(1);

    return existingPet.length === 0;
  } catch (error) {
    console.error('Check pet ID availability error:', error);
    return false;
  }
}

/**
 * Check if pet is linked to the current user
 */
export async function isPetLinkedToUser(petId: string, userEmail: string): Promise<boolean> {
  try {
    const pet = await db
      .select()
      .from(pets)
      .where(and(
        eq(pets.id, petId),
        eq(pets.userEmail, userEmail)
      ))
      .limit(1);

    return pet.length > 0;
  } catch (error) {
    console.error('Check pet linked to user error:', error);
    return false;
  }
}

/**
 * Create new pet (Firebase version - matches backup interface)
 */
export async function createNewPet(petId: string, petData: any): Promise<{ success: boolean; petId?: string; error?: string }> {
  try {
    // Note: This function is deprecated - use Firebase client-pets instead
    return { success: false, error: 'This function is deprecated. Use Firebase client-pets instead.' };

    // Transform the form data to match our PetData interface
    const transformedPetData: PetData = {
      name: petData.petName || '',
      description: '',
      imageUrl: petData.imageUrl || '',
      genderId: petData.genderId || 0,
      breedId: petData.breedId || 0,
      birthDate: petData.birthDate ? new Date(petData.birthDate).toISOString() : undefined,
      notes: petData.notes || '',
      ownerName: petData.ownerFullName || '',
      ownerPhone: petData.ownerPhoneNumber || '',
      ownerEmail: petData.ownerEmailAddress || '',
      ownerAddress: petData.ownerHomeAddress || '',
      vetId: petData.vetName ? 'vet-id' : undefined
    };

    // Add vet data to the petData object for Firebase function
    const petDataWithVet = {
      ...transformedPetData,
      vetName: petData.vetName || '',
      vetPhoneNumber: petData.vetPhoneNumber || '',
      vetEmailAddress: petData.vetEmailAddress || '',
      vetAddress: petData.vetAddress || ''
    };

    // Use Firebase to create the pet
    const { createPetInFirestore } = await import('@/src/lib/firebase/pets');
    const result = await createPetInFirestore(petDataWithVet, { email: session.user.email } as any);

    if (result.success) {
      return { success: true, petId: result.petId };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error('Create new pet error:', error);
    return { success: false, error: 'Failed to create pet' };
  }
}
