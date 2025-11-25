/**
 * Script to populate breeds and years (1-20) as audiences in Firestore
 * Run this script with: npx tsx scripts/populate-breeds-and-years.ts
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
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

// Extract Hebrew breed names - limit to first 20 breeds
const breedsHebrew = breedsData
  .map((breed: any) => breed.he)
  .filter(Boolean)
  .slice(0, 20); // Only take first 20 breeds

// Years from 1 to 20 in Hebrew format
const years = Array.from({ length: 20 }, (_, i) => {
  const num = i + 1;
  return `${num} שנים`; // "X שנים" means "X years" in Hebrew
});

async function populateBreedsAndYears() {
  console.log('🐕 Starting to populate breeds and years as audiences...\n');

  try {
    // Check if audiences already exist
    const existingAudiencesSnapshot = await getDocs(collection(db, 'audiences'));
    const existingNames = existingAudiencesSnapshot.docs.map(doc => doc.data().name);

    let breedsAddedCount = 0;
    let breedsSkippedCount = 0;
    let yearsAddedCount = 0;
    let yearsSkippedCount = 0;

    // Add breeds (first 20 only)
    console.log('📋 Adding breeds (first 20)...\n');
    for (const breed of breedsHebrew) {
      if (existingNames.includes(breed)) {
        console.log(`⏭️  Skipping breed: ${breed} (already exists)`);
        breedsSkippedCount++;
        continue;
      }

      const audienceData = {
        name: breed,
        description: `קהל לגזע ${breed}`, // "Audience for [breed] breed" in Hebrew
        targetCriteria: [breed],
        isActive: true,
        createdBy: 'system',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'audiences'), audienceData);
      console.log(`✅ Added breed: ${breed}`);
      breedsAddedCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add years
    console.log('\n📅 Adding years (1-20) in Hebrew...\n');
    for (const year of years) {
      const yearName = year; // Already in Hebrew format: "X שנים"
      const yearNumber = year.split(' ')[0]; // Extract the number
      
      if (existingNames.includes(yearName)) {
        console.log(`⏭️  Skipping year: ${yearName} (already exists)`);
        yearsSkippedCount++;
        continue;
      }

      const audienceData = {
        name: yearName,
        description: `קהל לחיות מחמד בגיל ${yearName}`, // "Audience for pets aged X years" in Hebrew
        targetCriteria: [yearNumber, yearName, `גיל ${yearNumber}`, `age ${yearNumber}`], // Include both Hebrew and English for matching
        isActive: true,
        createdBy: 'system',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'audiences'), audienceData);
      console.log(`✅ Added year: ${yearName}`);
      yearsAddedCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Added breeds: ${breedsAddedCount}`);
    console.log(`⏭️  Skipped breeds: ${breedsSkippedCount} (already existed)`);
    console.log(`✅ Added years: ${yearsAddedCount}`);
    console.log(`⏭️  Skipped years: ${yearsSkippedCount} (already existed)`);
    console.log(`📍 Total breeds: ${breedsHebrew.length}`);
    console.log(`📍 Total years: ${years.length}`);
    console.log('\n✨ Done!');

  } catch (error) {
    console.error('❌ Error populating breeds and years:', error);
    throw error;
  }
}

// Run the script
populateBreedsAndYears()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

