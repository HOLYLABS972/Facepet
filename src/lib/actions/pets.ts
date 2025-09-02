'use server';

import { auth } from '@/auth';
import { db } from '@/utils/database/drizzle';
import {
  isPetIdAvailable,
  markPetIdAsUsed
} from '@/utils/database/queries/pets';
import { breeds, owners, pets, vets } from '@/utils/database/schema';
import { and, eq } from 'drizzle-orm';

// Helper function to format Date to 'YYYY-MM-DD' or return null
const formatDateForDb = (
  date: Date | string | null | undefined
): string | null => {
  if (!date) return null;
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return null;
    }
    // Format to YYYY-MM-DD
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
};

export const checkPetIdAvailability = async (petId: string) => {
  try {
    const availablePet = await isPetIdAvailable(petId);
    if (!availablePet) {
      return {
        success: false,
        error: 'Pet ID is either already used or does not exist.'
      };
    }
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Pet ID is either already used or does not exist.'
    };
  }
};

export async function getPets(
  locale: string,
  userId: string
): Promise<{ id: string; name: string; breed: string; image: string }[]> {
  const results = await db
    .select({
      id: pets.id,
      name: pets.name,
      breed: locale === 'he' ? breeds.he : breeds.en,
      image: pets.imageUrl
    })
    .from(pets)
    .leftJoin(breeds, eq(pets.breedId, breeds.id))
    .where(eq(pets.userId, userId));

  return results.map((result) => ({
    ...result,
    breed: result.breed || ''
  }));
}

// New function to check if a pet is linked to a given user
export const isPetLinkedToUser = async (
  petId: string,
  userId: string
): Promise<boolean> => {
  const result = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, userId)))
    .limit(1);
  return result.length > 0;
};

export const createNewPet = async (
  petId: string | null,
  params: NewPetData
): Promise<{ success: boolean; error?: string; pet?: { id: string } }> => {
  // Validate inputs
  if (!petId) {
    return { success: false, error: 'No Pet ID provided' };
  }

  // Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  const userId = session.user.id;

  // Check pet ID availability
  const petIdCheckResult = await checkPetIdAvailability(petId);
  if (!petIdCheckResult.success) {
    return petIdCheckResult;
  }

  try {
    // 1. Insert owner
    const ownerResult = await db
      .insert(owners)
      .values({
        fullName: params.ownerFullName,
        phoneNumber: params.ownerPhoneNumber,
        email: params.ownerEmailAddress,
        homeAddress: params.ownerHomeAddress,
        // Privacy settings - name is always public
        isPhonePrivate: params.isOwnerPhonePrivate || false,
        isEmailPrivate: params.isOwnerEmailPrivate || false,
        isAddressPrivate: params.isOwnerAddressPrivate || false
      })
      .returning({ id: owners.id });

    if (!ownerResult[0]?.id) {
      return { success: false, error: 'Failed to create owner record' };
    }
    const ownerId = ownerResult[0].id;

    // 2. Insert vet
    const vetResult = await db
      .insert(vets)
      .values({
        name: params.vetName,
        phoneNumber: params.vetPhoneNumber,
        email: params.vetEmailAddress,
        address: params.vetAddress,
        // Privacy settings
        isNamePrivate: params.isVetNamePrivate || false,
        isPhonePrivate: params.isVetPhonePrivate || false,
        isEmailPrivate: params.isVetEmailPrivate || false,
        isAddressPrivate: params.isVetAddressPrivate || false
      })
      .returning({ id: vets.id });

    if (!vetResult[0]?.id) {
      // In a transaction, we would roll back. Here we need to manually clean up
      await db.delete(owners).where(eq(owners.id, ownerId));
      return { success: false, error: 'Failed to create vet record' };
    }
    const vetId = vetResult[0].id;

    // 3. Insert pet
    await db.insert(pets).values({
      id: petId,
      name: params.petName || '',
      imageUrl: params.imageUrl || '',
      breedId: params.breedId || 0,
      genderId: params.genderId || 0,
      birthDate: formatDateForDb(params.birthDate),
      notes: params.notes || '',
      userId,
      ownerId,
      vetId
      // All pet information is always public
    });

    // 4. Mark pet ID as used
    await markPetIdAsUsed(petId);

    return { success: true, pet: { id: petId } };
  } catch (error) {
    console.error('Pet creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Pet creation failed'
    };
  }
};

export const updatePet = async (petId: string, params: NewPetData) => {
  const {
    imageUrl,
    petName,
    breedId,
    genderId,
    birthDate,
    notes,
    ownerFullName,
    ownerPhoneNumber,
    ownerEmailAddress,
    ownerHomeAddress,
    vetName,
    vetPhoneNumber,
    vetEmailAddress,
    vetAddress
  } = params;

  if (!petId) {
    return { success: false, error: 'No Pet Id provided' };
  }

  try {
    // Ensure the user is authenticated.
    const session = await auth();
    if (!session || !session.user || !session.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isLinked = await isPetLinkedToUser(petId, session.user.id);
    if (!isLinked) {
      return { success: false, error: 'Unauthorized' };
    }

    // Retrieve the existing pet record to obtain ownerId and vetId.
    const petRecords = await db
      .select()
      .from(pets)
      .where(eq(pets.id, petId))
      .limit(1);
    if (!petRecords || petRecords.length === 0) {
      return { success: false, error: 'Pet does not exist' };
    }

    const petRecord = petRecords[0];
    const ownerId = petRecord.ownerId;
    const vetId = petRecord.vetId;

    // Update the pet record.
    await db
      .update(pets)
      .set({
        name: petName || '',
        imageUrl: imageUrl || '',
        breedId: breedId || 0,
        genderId: genderId || 0,
        birthDate: formatDateForDb(birthDate),
        notes: notes || ''
        // All pet information is always public
      })
      .where(eq(pets.id, petId));

    // Update the owner record.
    await db
      .update(owners)
      .set({
        fullName: ownerFullName,
        phoneNumber: ownerPhoneNumber,
        email: ownerEmailAddress,
        homeAddress: ownerHomeAddress,
        // Privacy settings - name is always public
        isPhonePrivate: params.isOwnerPhonePrivate ?? false,
        isEmailPrivate: params.isOwnerEmailPrivate ?? false,
        isAddressPrivate: params.isOwnerAddressPrivate ?? false
      })
      .where(eq(owners.id, ownerId));

    await db
      .update(vets)
      .set({
        name: vetName,
        phoneNumber: vetPhoneNumber,
        email: vetEmailAddress,
        address: vetAddress,
        // Privacy settings
        isNamePrivate: params.isVetNamePrivate ?? false,
        isPhonePrivate: params.isVetPhonePrivate ?? false,
        isEmailPrivate: params.isVetEmailPrivate ?? false,
        isAddressPrivate: params.isVetAddressPrivate ?? false
      })
      .where(eq(vets.id, vetId));

    return { success: true };
  } catch (error) {
    console.error('Pet update error:', error);
    return { success: false, error: 'Pet update error' };
  }
};
