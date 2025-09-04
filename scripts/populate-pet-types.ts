import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

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

const petTypes = [
  { name: 'Dog', labels: { en: 'Dog', he: 'כלב' } },
  { name: 'Cat', labels: { en: 'Cat', he: 'חתול' } },
  { name: 'Bird', labels: { en: 'Bird', he: 'ציפור' } },
  { name: 'Fish', labels: { en: 'Fish', he: 'דג' } },
  { name: 'Rabbit', labels: { en: 'Rabbit', he: 'ארנב' } },
  { name: 'Hamster', labels: { en: 'Hamster', he: 'אוגר' } },
  { name: 'Guinea Pig', labels: { en: 'Guinea Pig', he: 'שרקן' } },
  { name: 'Turtle', labels: { en: 'Turtle', he: 'צב' } },
  { name: 'Snake', labels: { en: 'Snake', he: 'נחש' } },
  { name: 'Lizard', labels: { en: 'Lizard', he: 'לטאה' } },
  { name: 'Ferret', labels: { en: 'Ferret', he: 'חמוס' } },
  { name: 'Other', labels: { en: 'Other', he: 'אחר' } },
];

async function populatePetTypes() {
  try {
    console.log('Starting to populate pet types...');

    // Check if petTypes collection already has data
    const typesRef = collection(db, 'petTypes');
    const typesSnapshot = await getDocs(typesRef);
    
    if (typesSnapshot.size === 0) {
      console.log('Populating pet types collection...');
      for (const petType of petTypes) {
        await addDoc(typesRef, {
          ...petType,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      console.log('✅ Pet types collection populated successfully');
    } else {
      console.log('ℹ️ Pet types collection already has data, skipping...');
    }

    console.log('🎉 Pet types population completed!');
  } catch (error) {
    console.error('❌ Error populating pet types:', error);
  }
}

// Run the script
populatePetTypes();
