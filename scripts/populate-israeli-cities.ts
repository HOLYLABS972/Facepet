/**
 * Script to populate Israeli cities as audiences in Firestore
 * Run this script with: npx tsx scripts/populate-israeli-cities.ts
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

// 20 major Israeli cities
const israeliCities = [
  'Jerusalem',
  'Tel Aviv',
  'Haifa',
  'Rishon LeZion',
  'Petah Tikva',
  'Ashdod',
  'Netanya',
  'Beersheba',
  'Holon',
  'Bnei Brak',
  'Ramat Gan',
  'Rehovot',
  'Bat Yam',
  'Ashkelon',
  'Herzliya',
  'Kfar Saba',
  'Hadera',
  'Modiin',
  'Nazareth',
  'Lod'
];

async function populateIsraeliCities() {
  console.log('🇮🇱 Starting to populate Israeli cities...\n');

  try {
    // Check if audiences already exist
    const existingAudiencesSnapshot = await getDocs(collection(db, 'audiences'));
    const existingNames = existingAudiencesSnapshot.docs.map(doc => doc.data().name);

    let addedCount = 0;
    let skippedCount = 0;

    for (const city of israeliCities) {
      if (existingNames.includes(city)) {
        console.log(`⏭️  Skipping ${city} (already exists)`);
        skippedCount++;
        continue;
      }

      const audienceData = {
        name: city,
        description: '',
        targetCriteria: [],
        isActive: true,
        createdBy: 'system',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'audiences'), audienceData);
      console.log(`✅ Added: ${city}`);
      addedCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Added: ${addedCount} cities`);
    console.log(`⏭️  Skipped: ${skippedCount} cities (already existed)`);
    console.log(`📍 Total cities: ${israeliCities.length}`);
    console.log('\n✨ Done!');

  } catch (error) {
    console.error('❌ Error populating cities:', error);
    throw error;
  }
}

// Run the script
populateIsraeliCities()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

