import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import breedsData from '../breeds.json';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDM3nU5ifIk5wF3kcdToWpjDD6U5VP5Jk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "facepet-48b13.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "facepet-48b13",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "facepet-48b13.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1055059508691",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1055059508691:web:f530c111ec812d4e9f4326",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ML6XD5X9C2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const breeds = [
  // Dogs - All breeds from breeds.json (IDs 1-174)
  ...breedsData.filter(breed => breed.id >= 1 && breed.id <= 174).map(breed => ({
    name: breed.en,
    type: 'dog',
    labels: { en: breed.en, he: breed.he }
  })),
  
  // Cats - All breeds from breeds.json (IDs 175-209)
  ...breedsData.filter(breed => breed.id >= 175 && breed.id <= 209).map(breed => ({
    name: breed.en,
    type: 'cat',
    labels: { en: breed.en, he: breed.he }
  })),
  
  // Birds (keeping existing bird breeds)
  { name: 'Budgerigar', type: 'bird', labels: { en: 'Budgerigar (Budgie)', he: 'תוכי אוסטרלי' } },
  { name: 'Cockatiel', type: 'bird', labels: { en: 'Cockatiel', he: 'קוקטיל' } },
  { name: 'Canary', type: 'bird', labels: { en: 'Canary', he: 'קנרית' } },
  { name: 'Mixed Breed', type: 'bird', labels: { en: 'Mixed Breed', he: 'גזע מעורב' } },
];

const genders = [
  { labels: { en: 'Male', he: 'זכר' } },
  { labels: { en: 'Female', he: 'נקבה' } },
  { labels: { en: 'Unknown', he: 'לא ידוע' } },
];

async function populateCollections() {
  try {
    console.log('Starting to populate Firebase collections...');

    // Check if breeds collection already has data
    const breedsRef = collection(db, 'breeds');
    const breedsSnapshot = await getDocs(breedsRef);
    
    if (breedsSnapshot.size === 0) {
      console.log('Populating breeds collection...');
      for (const breed of breeds) {
        await addDoc(breedsRef, breed);
      }
      console.log('✅ Breeds collection populated successfully');
    } else {
      console.log('ℹ️ Breeds collection already has data, skipping...');
    }

    // Check if genders collection already has data
    const gendersRef = collection(db, 'genders');
    const gendersSnapshot = await getDocs(gendersRef);
    
    if (gendersSnapshot.size === 0) {
      console.log('Populating genders collection...');
      for (const gender of genders) {
        await addDoc(gendersRef, gender);
      }
      console.log('✅ Genders collection populated successfully');
    } else {
      console.log('ℹ️ Genders collection already has data, skipping...');
    }

    console.log('🎉 All collections populated successfully!');
  } catch (error) {
    console.error('❌ Error populating collections:', error);
  }
}

// Run the script
populateCollections();
