'use server';

import breedsData from '@/utils/database/seeds/breeds.json';
import gendersData from '@/utils/database/seeds/genders.json';
import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { breeds, genders, petIdsPool } from './schema';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

export const populatePetIdsPool = async (count: number) => {
  const newIds = Array.from({ length: count }).map(() => ({
    id: randomUUID(),
    isUsed: false
  }));

  await db.insert(petIdsPool).values(newIds);

  console.log(`Inserted ${count} pet IDs into the pool.`);
};

async function seed() {
  console.log('Starting database seeding...');

  await populatePetIdsPool(1000);

  for (const gender of gendersData) {
    await db.insert(genders).values(gender);
    console.log(`Inserted gender: ${gender.en}`);
  }

  for (const breed of breedsData) {
    await db.insert(breeds).values(breed);
    console.log(`Inserted breed: ${breed.en}`);
  }
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
