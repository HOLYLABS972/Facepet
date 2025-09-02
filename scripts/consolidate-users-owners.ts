#!/usr/bin/env tsx

/**
 * Migration script to consolidate users and owners collections
 * This script will:
 * 1. Merge owner data into users collection
 * 2. Update pets collection to remove ownerId references
 * 3. Delete the owners collection
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

interface MigrationStats {
  usersProcessed: number;
  petsUpdated: number;
  ownersDeleted: number;
  errors: string[];
}

async function consolidateUsersAndOwners(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    usersProcessed: 0,
    petsUpdated: 0,
    ownersDeleted: 0,
    errors: []
  };

  try {
    console.log('🔄 Starting users and owners consolidation...');

    // Step 1: Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users`);

    // Step 2: Get all owners
    const ownersSnapshot = await db.collection('owners').get();
    console.log(`📊 Found ${ownersSnapshot.size} owners`);

    // Step 3: Create a map of owners by email for quick lookup
    const ownersByEmail = new Map();
    ownersSnapshot.forEach(doc => {
      const owner = doc.data();
      ownersByEmail.set(owner.email, { id: doc.id, ...owner });
    });

    // Step 4: Update users with owner data
    const batch = db.batch();
    let batchCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data();
      const owner = ownersByEmail.get(user.email);

      if (owner) {
        // Merge owner data into user
        const updatedUser = {
          ...user,
          phoneNumber: owner.phoneNumber,
          homeAddress: owner.homeAddress,
          postcode: owner.postcode,
          isPhonePrivate: owner.isPhonePrivate || false,
          isEmailPrivate: owner.isEmailPrivate || false,
          isAddressPrivate: owner.isAddressPrivate || false,
          updatedAt: new Date()
        };

        batch.update(userDoc.ref, updatedUser);
        batchCount++;
        stats.usersProcessed++;

        if (batchCount >= 500) {
          await batch.commit();
          console.log(`✅ Updated ${batchCount} users`);
          batchCount = 0;
        }
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Updated ${batchCount} users`);
    }

    // Step 5: Update pets collection to remove ownerId references
    console.log('🔄 Updating pets collection...');
    const petsSnapshot = await db.collection('pets').get();
    
    const petsBatch = db.batch();
    let petsBatchCount = 0;

    for (const petDoc of petsSnapshot.docs) {
      const pet = petDoc.data();
      
      // Remove ownerId field
      const { ownerId, ...updatedPet } = pet;
      
      petsBatch.update(petDoc.ref, {
        ...updatedPet,
        updatedAt: new Date()
      });
      
      petsBatchCount++;
      stats.petsUpdated++;

      if (petsBatchCount >= 500) {
        await petsBatch.commit();
        console.log(`✅ Updated ${petsBatchCount} pets`);
        petsBatchCount = 0;
      }
    }

    // Commit remaining pet updates
    if (petsBatchCount > 0) {
      await petsBatch.commit();
      console.log(`✅ Updated ${petsBatchCount} pets`);
    }

    // Step 6: Delete owners collection
    console.log('🔄 Deleting owners collection...');
    const ownersToDelete = ownersSnapshot.docs;
    
    const deleteBatch = db.batch();
    let deleteBatchCount = 0;

    for (const ownerDoc of ownersToDelete) {
      deleteBatch.delete(ownerDoc.ref);
      deleteBatchCount++;
      stats.ownersDeleted++;

      if (deleteBatchCount >= 500) {
        await deleteBatch.commit();
        console.log(`✅ Deleted ${deleteBatchCount} owners`);
        deleteBatchCount = 0;
      }
    }

    // Commit remaining deletions
    if (deleteBatchCount > 0) {
      await deleteBatch.commit();
      console.log(`✅ Deleted ${deleteBatchCount} owners`);
    }

    console.log('🎉 Consolidation completed successfully!');
    console.log(`📊 Final stats:`, stats);

  } catch (error: any) {
    console.error('❌ Consolidation failed:', error);
    stats.errors.push(`Consolidation failed: ${error.message}`);
  }

  return stats;
}

// Run the migration
if (require.main === module) {
  consolidateUsersAndOwners()
    .then((stats) => {
      console.log('Migration completed with stats:', stats);
      process.exit(stats.errors.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { consolidateUsersAndOwners };
