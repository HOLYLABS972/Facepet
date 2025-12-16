/**
 * Script to cleanup breeds audiences - keep only first 20 breeds
 * Run this script with: npx tsx scripts/cleanup-breeds-to-20.ts
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables (same as Next.js app)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Use the same Firebase config as the Next.js app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDM3nU5ifIk5wF3kcdToVWpjDD6U5VP5Jk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "facepet-48b13.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "facepet-48b13",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "facepet-48b13.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1055059508691",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1055059508691:web:f530c111ec812d4e9f4326",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ML6XD5X9C2"
};

// Initialize Firebase (same as Next.js app)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Load breeds from breeds.json
const breedsPath = path.resolve(process.cwd(), 'breeds.json');
const breedsData = JSON.parse(fs.readFileSync(breedsPath, 'utf8'));

// Extract Hebrew breed names - only first 20 breeds to keep
const breedsToKeep = breedsData
  .map((breed: any) => breed.he)
  .filter(Boolean)
  .slice(0, 20);

async function cleanupBreedsTo20() {
  console.log('🧹 Starting to cleanup breeds audiences (keeping only first 20)...\n');
  console.log(`📋 Breeds to keep: ${breedsToKeep.length}\n`);

  try {
    // Get all audiences
    const allAudiencesSnapshot = await getDocs(collection(db, 'audiences'));
    const allAudiences = allAudiencesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      createdBy: doc.data().createdBy
    }));

    // Filter breed audiences (created by system and match breed names)
    const breedAudiences = allAudiences.filter(audience => 
      audience.createdBy === 'system' && 
      breedsData.some((breed: any) => breed.he === audience.name)
    );

    console.log(`📊 Found ${breedAudiences.length} breed audiences\n`);

    // Find breeds to delete (not in the first 20)
    const breedsToDelete = breedAudiences.filter(audience => 
      !breedsToKeep.includes(audience.name)
    );

    console.log(`🗑️  Breeds to delete: ${breedsToDelete.length}\n`);

    if (breedsToDelete.length === 0) {
      console.log('✅ No breeds to delete. All breed audiences are within the first 20.\n');
      return;
    }

    let deletedCount = 0;
    let errorCount = 0;

    // Delete extra breed audiences
    for (const audience of breedsToDelete) {
      try {
        await deleteDoc(doc(db, 'audiences', audience.id));
        console.log(`✅ Deleted: ${audience.name}`);
        deletedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error deleting ${audience.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Deleted: ${deletedCount} breed audiences`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Kept: ${breedsToKeep.length} breed audiences`);
    console.log('\n✨ Cleanup done!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the script
cleanupBreedsTo20()
  .then(() => {
    console.log('\n🎉 Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
























