#!/usr/bin/env tsx

/**
 * Migration script to transfer data from PostgreSQL/Drizzle to Firebase Firestore
 * 
 * This script helps migrate existing data to Firebase.
 * Run this after setting up Firebase and before switching the application to use Firebase.
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { adminDb } from '../src/lib/firebase/admin';
import { collection, addDoc, doc, setDoc } from 'firebase-admin/firestore';

// Load environment variables
config({ path: '.env.local' });

// Initialize Drizzle (current database)
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

interface MigrationStats {
  users: number;
  pets: number;
  owners: number;
  vets: number;
  genders: number;
  breeds: number;
  contactSubmissions: number;
  errors: string[];
}

async function migrateStaticData(): Promise<Partial<MigrationStats>> {
  const stats: Partial<MigrationStats> = { errors: [] };

  try {
    console.log('🔄 Migrating static data (genders, breeds)...');

    // Migrate genders
    const gendersResult = await sql`SELECT * FROM genders`;
    for (const gender of gendersResult) {
      await setDoc(doc(adminDb, 'genders', gender.id.toString()), {
        en: gender.en,
        he: gender.he
      });
    }
    stats.genders = gendersResult.length;
    console.log(`✅ Migrated ${gendersResult.length} genders`);

    // Migrate breeds
    const breedsResult = await sql`SELECT * FROM breeds`;
    for (const breed of breedsResult) {
      await setDoc(doc(adminDb, 'breeds', breed.id.toString()), {
        en: breed.en,
        he: breed.he
      });
    }
    stats.breeds = breedsResult.length;
    console.log(`✅ Migrated ${breedsResult.length} breeds`);

  } catch (error) {
    console.error('❌ Error migrating static data:', error);
    stats.errors?.push(`Static data migration failed: ${error}`);
  }

  return stats;
}

async function migrateUsers(): Promise<Partial<MigrationStats>> {
  const stats: Partial<MigrationStats> = { errors: [] };

  try {
    console.log('🔄 Migrating users...');

    const usersResult = await sql`SELECT * FROM users`;
    for (const user of usersResult) {
      await setDoc(doc(adminDb, 'users', user.id), {
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        password: user.password,
        role: user.role || 'user',
        emailVerified: user.email_verified || false,
        emailVerifiedAt: user.email_verified_at ? new Date(user.email_verified_at) : null,
        lastActivityDate: user.last_activity_date ? new Date(user.last_activity_date) : new Date(),
        createdAt: user.created_at ? new Date(user.created_at) : new Date()
      });
    }
    stats.users = usersResult.length;
    console.log(`✅ Migrated ${usersResult.length} users`);

  } catch (error) {
    console.error('❌ Error migrating users:', error);
    stats.errors?.push(`Users migration failed: ${error}`);
  }

  return stats;
}

async function migrateOwners(): Promise<Partial<MigrationStats>> {
  const stats: Partial<MigrationStats> = { errors: [] };

  try {
    console.log('🔄 Migrating owners...');

    const ownersResult = await sql`SELECT * FROM owners`;
    for (const owner of ownersResult) {
      await setDoc(doc(adminDb, 'owners', owner.id), {
        fullName: owner.full_name,
        phoneNumber: owner.phone_number,
        email: owner.email,
        homeAddress: owner.home_address,
        isPhonePrivate: owner.is_phone_private || false,
        isEmailPrivate: owner.is_email_private || false,
        isAddressPrivate: owner.is_address_private || false
      });
    }
    stats.owners = ownersResult.length;
    console.log(`✅ Migrated ${ownersResult.length} owners`);

  } catch (error) {
    console.error('❌ Error migrating owners:', error);
    stats.errors?.push(`Owners migration failed: ${error}`);
  }

  return stats;
}

async function migrateVets(): Promise<Partial<MigrationStats>> {
  const stats: Partial<MigrationStats> = { errors: [] };

  try {
    console.log('🔄 Migrating vets...');

    const vetsResult = await sql`SELECT * FROM vets`;
    for (const vet of vetsResult) {
      await setDoc(doc(adminDb, 'vets', vet.id), {
        name: vet.name,
        phoneNumber: vet.phone_number,
        email: vet.email,
        address: vet.address,
        isNamePrivate: vet.is_name_private || false,
        isPhonePrivate: vet.is_phone_private || false,
        isEmailPrivate: vet.is_email_private || false,
        isAddressPrivate: vet.is_address_private || false
      });
    }
    stats.vets = vetsResult.length;
    console.log(`✅ Migrated ${vetsResult.length} vets`);

  } catch (error) {
    console.error('❌ Error migrating vets:', error);
    stats.errors?.push(`Vets migration failed: ${error}`);
  }

  return stats;
}

async function migratePets(): Promise<Partial<MigrationStats>> {
  const stats: Partial<MigrationStats> = { errors: [] };

  try {
    console.log('🔄 Migrating pets...');

    const petsResult = await sql`SELECT * FROM pets`;
    for (const pet of petsResult) {
      await setDoc(doc(adminDb, 'pets', pet.id), {
        name: pet.name,
        imageUrl: pet.image_url,
        genderId: pet.gender_id,
        breedId: pet.breed_id,
        birthDate: pet.birth_date ? new Date(pet.birth_date) : null,
        notes: pet.notes,
        userId: pet.user_id,
        ownerId: pet.owner_id,
        vetId: pet.vet_id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    stats.pets = petsResult.length;
    console.log(`✅ Migrated ${petsResult.length} pets`);

  } catch (error) {
    console.error('❌ Error migrating pets:', error);
    stats.errors?.push(`Pets migration failed: ${error}`);
  }

  return stats;
}

async function migrateContactSubmissions(): Promise<Partial<MigrationStats>> {
  const stats: Partial<MigrationStats> = { errors: [] };

  try {
    console.log('🔄 Migrating contact submissions...');

    const contactResult = await sql`SELECT * FROM contact_submissions`;
    for (const contact of contactResult) {
      await setDoc(doc(adminDb, 'contactSubmissions', contact.id), {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        subject: contact.subject,
        message: contact.message,
        status: contact.status || 'pending',
        createdAt: contact.created_at ? new Date(contact.created_at) : new Date(),
        updatedAt: contact.updated_at ? new Date(contact.updated_at) : new Date()
      });
    }
    stats.contactSubmissions = contactResult.length;
    console.log(`✅ Migrated ${contactResult.length} contact submissions`);

  } catch (error) {
    console.error('❌ Error migrating contact submissions:', error);
    stats.errors?.push(`Contact submissions migration failed: ${error}`);
  }

  return stats;
}

async function main() {
  console.log('🚀 Starting Firebase migration...');
  console.log('⚠️  Make sure you have set up Firebase and configured environment variables!');
  
  const allStats: MigrationStats = {
    users: 0,
    pets: 0,
    owners: 0,
    vets: 0,
    genders: 0,
    breeds: 0,
    contactSubmissions: 0,
    errors: []
  };

  // Migrate in order (dependencies first)
  const staticStats = await migrateStaticData();
  Object.assign(allStats, staticStats);

  const usersStats = await migrateUsers();
  Object.assign(allStats, usersStats);

  const ownersStats = await migrateOwners();
  Object.assign(allStats, ownersStats);

  const vetsStats = await migrateVets();
  Object.assign(allStats, vetsStats);

  const petsStats = await migratePets();
  Object.assign(allStats, petsStats);

  const contactStats = await migrateContactSubmissions();
  Object.assign(allStats, contactStats);

  // Print summary
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Users: ${allStats.users}`);
  console.log(`✅ Pets: ${allStats.pets}`);
  console.log(`✅ Owners: ${allStats.owners}`);
  console.log(`✅ Vets: ${allStats.vets}`);
  console.log(`✅ Genders: ${allStats.genders}`);
  console.log(`✅ Breeds: ${allStats.breeds}`);
  console.log(`✅ Contact Submissions: ${allStats.contactSubmissions}`);

  if (allStats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    allStats.errors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('\n🎉 Migration completed successfully!');
  }

  process.exit(0);
}

// Run migration
main().catch(console.error);
