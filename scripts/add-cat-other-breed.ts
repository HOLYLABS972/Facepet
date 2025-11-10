import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

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

async function addCatOtherBreed() {
  try {
    console.log('🔍 Checking if "other" breed for cats already exists...');
    
    // Check if "other" breed for cats already exists
    const breedsRef = collection(db, 'breeds');
    const otherCatQuery = query(
      breedsRef, 
      where('type', '==', 'cat'),
      where('name', '==', 'other')
    );
    
    const existingOther = await getDocs(otherCatQuery);
    
    if (existingOther.size > 0) {
      console.log('ℹ️ "Other" breed for cats already exists in Firebase');
      return;
    }
    
    console.log('➕ Adding "other" breed for cats to Firebase...');
    
    // Add the "other" breed for cats
    const otherBreed = {
      name: 'other',
      type: 'cat',
      labels: { 
        en: 'other', 
        he: 'אחר' 
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(breedsRef, otherBreed);
    
    console.log('✅ Successfully added "other" breed for cats to Firebase!');
    
    // Verify the addition
    const allCatBreeds = await getDocs(query(breedsRef, where('type', '==', 'cat')));
    console.log(`📊 Total cat breeds in Firebase: ${allCatBreeds.size}`);
    
    // List all cat breeds for verification
    console.log('🐱 All cat breeds in Firebase:');
    allCatBreeds.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. ${data.labels?.en || data.name} (${data.labels?.he || 'no hebrew'})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding cat "other" breed:', error);
  }
}

// Run the script
addCatOtherBreed();
