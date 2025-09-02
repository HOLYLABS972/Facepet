import { db } from '@/utils/database/drizzle';
import { breeds, pets } from '@/utils/database/schema';
import { eq } from 'drizzle-orm';

export const getPetsForUser = async (
  userId: string,
  locale: string = 'en'
): Promise<{ id: string; name: string; breed: string; image: string }[]> => {
  try {
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
  } catch (error) {
    console.error('Error fetching pets:', error);
    return [];
  }
};