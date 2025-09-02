import { getPlaceFormattedAddress } from '@/src/lib/google';
import { db } from '@/utils/database/drizzle';
import {
  breeds,
  genders,
  owners,
  petIdsPool,
  pets,
  vets
} from '@/utils/database/schema';
import { Language } from '@googlemaps/google-maps-services-js';
import { UUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { getLocale } from 'next-intl/server';
import { validate as isValidUUID } from 'uuid';

/**
 * Helper function to get formatted address from API
 */
async function getFormattedAddress(
  placeId: string,
  locale: Language
): Promise<string> {
  try {
    // Fetch from API
    const formattedAddress = await getPlaceFormattedAddress(placeId, locale);
    if (formattedAddress) {
      return formattedAddress;
    }

    // Return original placeId if API fails
    return placeId;
  } catch (error) {
    console.error('Error in getFormattedAddress:', error);
    return placeId; // Fallback to original value
  }
}

export const getPetDetailsById = async (id: UUID): Promise<Pet | null> => {
  if (!isValidUUID(id)) {
    console.error(`Invalid pet ID format: ${id}`);
    return null;
  }

  try {
    // Fetch raw data from the database
    const rows = await db
      .select({
        id: pets.id,
        name: pets.name,
        imageUrl: pets.imageUrl,
        birthDate: pets.birthDate,
        notes: pets.notes,
        userId: pets.userId,
        gender: { en: genders.en, he: genders.he },
        breed: { en: breeds.en, he: breeds.he },
        // All pet information is always public
        owner: {
          fullName: owners.fullName,
          phoneNumber: owners.phoneNumber,
          email: owners.email,
          homeAddress: owners.homeAddress,
          // Owner privacy settings - name is always public
          isPhonePrivate: owners.isPhonePrivate,
          isEmailPrivate: owners.isEmailPrivate,
          isAddressPrivate: owners.isAddressPrivate
        },
        vet: {
          name: vets.name,
          phoneNumber: vets.phoneNumber,
          email: vets.email,
          address: vets.address,
          // Vet privacy settings
          isNamePrivate: vets.isNamePrivate,
          isPhonePrivate: vets.isPhonePrivate,
          isEmailPrivate: vets.isEmailPrivate,
          isAddressPrivate: vets.isAddressPrivate
        }
      })
      .from(pets)
      .leftJoin(genders, eq(pets.genderId, genders.id))
      .leftJoin(breeds, eq(pets.breedId, breeds.id))
      .leftJoin(owners, eq(pets.ownerId, owners.id))
      .leftJoin(vets, eq(pets.vetId, vets.id))
      .where(eq(pets.id, id))
      .limit(1);

    // If no pet found, return null
    if (!rows.length) {
      return null;
    }

    // 2. Transform data - ensure all required properties have defaults to satisfy type requirements
    const rawPet = rows[0];
    const transformedPet = {
      ...rawPet,
      gender: rawPet.gender || { en: '', he: '' },
      breed: rawPet.breed || { en: '', he: '' },
      owner: rawPet.owner ? { ...rawPet.owner } : null,
      vet: rawPet.vet ? { ...rawPet.vet } : null
    };

    // 3. Enhance with address formatting (non-blocking)
    const locale = await getLocale();

    // Get formatted addresses from API
    const [ownerAddress, vetAddress] = await Promise.all([
      transformedPet.owner?.homeAddress
        ? getFormattedAddress(
            transformedPet.owner.homeAddress,
            locale as Language
          )
        : null,
      transformedPet.vet?.address
        ? getFormattedAddress(transformedPet.vet.address, locale as Language)
        : null
    ]);

    // Apply formatted addresses if available
    if (transformedPet.owner && ownerAddress) {
      transformedPet.owner.homeAddress = ownerAddress;
    }

    if (transformedPet.vet && vetAddress) {
      transformedPet.vet.address = vetAddress;
    }

    const finalPet = transformedPet as Pet;

    return finalPet;
  } catch (error) {
    console.error('Database error in getPetDetailsById:', error);
    return null;
  }
};

export const getPetDetailsForEditById = async (
  id: string
): Promise<PetForEdit | null> => {
  if (!isValidUUID(id)) {
    console.error(`Invalid pet ID format: ${id}`);
    return null;
  }

  try {
    // Fetch raw data from the database with IDs for editable fields
    const rows = await db
      .select({
        id: pets.id,
        name: pets.name,
        imageUrl: pets.imageUrl,
        birthDate: pets.birthDate,
        notes: pets.notes,
        gender: pets.genderId,
        breed: pets.breedId,
        // All pet information is always public
        owner: {
          fullName: owners.fullName,
          phoneNumber: owners.phoneNumber,
          email: owners.email,
          homeAddress: owners.homeAddress,
          // Owner privacy settings - name is always public
          isPhonePrivate: owners.isPhonePrivate,
          isEmailPrivate: owners.isEmailPrivate,
          isAddressPrivate: owners.isAddressPrivate
        },
        vet: {
          name: vets.name,
          phoneNumber: vets.phoneNumber,
          email: vets.email,
          address: vets.address,
          // Vet privacy settings
          isNamePrivate: vets.isNamePrivate,
          isPhonePrivate: vets.isPhonePrivate,
          isEmailPrivate: vets.isEmailPrivate,
          isAddressPrivate: vets.isAddressPrivate
        }
      })
      .from(pets)
      .leftJoin(owners, eq(pets.ownerId, owners.id))
      .leftJoin(vets, eq(pets.vetId, vets.id))
      .where(eq(pets.id, id))
      .limit(1);

    // If no pet found, return null
    if (!rows.length) {
      return null;
    }

    // Transform data for edit form
    const petForEdit = {
      ...rows[0],
      owner: rows[0].owner || null,
      vet: rows[0].vet || null
    };

    return petForEdit as PetForEdit;
  } catch (error) {
    console.error('Database error in getPetDetailsForEditById:', error);
    return null;
  }
};

/**
 * Fetches pet genders in all available languages.
 *
 * @returns An array of objects containing id and labels for all languages.
 */
export const getPetGenders = async () => {
  // Fetch from database
  const results = await db
    .select({
      id: genders.id,
      labels: {
        en: genders.en,
        he: genders.he
      }
    })
    .from(genders);

  return results;
};

/**
 * Fetches pet breeds in all available languages.
 *
 * @returns An array of objects containing id and labels for all languages.
 */
export const getPetBreeds = async () => {
  // Fetch from database
  const results = await db
    .select({
      id: breeds.id,
      labels: {
        en: breeds.en,
        he: breeds.he
      }
    })
    .from(breeds);

  return results;
};

/**
 * Checks if a given pet ID is available for use.
 *
 * @param petId - The pet ID to check for availability.
 * @returns A promise that resolves to a boolean indicating whether the pet ID is available (true) or not (false).
 */
export const isPetIdAvailable = async (petId: string): Promise<boolean> => {
  const result = await db
    .select()
    .from(petIdsPool)
    .where(and(eq(petIdsPool.id, petId), eq(petIdsPool.isUsed, false)))
    .limit(1);

  return result.length > 0;
};

/**
 * Marks a pet ID as used in the database.
 *
 * This function updates the `isUsed` field of a pet ID in the `petIdsPool` table to `true`
 * if the pet ID matches the provided `petId` and its `isUsed` field is currently `false`.
 *
 * @param petId - The ID of the pet to mark as used.
 * @returns A promise that resolves to `true` if the pet ID was successfully marked as used, otherwise `false`.
 */
export const markPetIdAsUsed = async (petId: string): Promise<boolean> => {
  const result = await db
    .update(petIdsPool)
    .set({ isUsed: true })
    .where(and(eq(petIdsPool.id, petId), eq(petIdsPool.isUsed, false)))
    .returning({ updatedId: petIdsPool.id });

  return result.length > 0; // Returns true if an ID was updated
};
