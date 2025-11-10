// Simple Node.js script to add "other" breed for cats to Firebase
// Run with: node scripts/update-firebase-breeds.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDM3nU5ifIk5wF3kcdToWpjDD6U5VP5Jk",
  authDomain: "facepet-48b13.firebaseapp.com",
  projectId: "facepet-48b13",
  storageBucket: "facepet-48b13.firebasestorage.app",
  messagingSenderId: "1055059508691",
  appId: "1:1055059508691:web:f530c111ec812d4e9f4326",
  measurementId: "G-ML6XD5X9C2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateFirebaseBreeds() {
  try {
    console.log('🔍 Checking Firebase breeds collection...');
    
    const breedsRef = collection(db, 'breeds');
    
    // Check if "other" breed for cats exists
    const otherCatQuery = query(
      breedsRef, 
      where('type', '==', 'cat'),
      where('name', '==', 'other')
    );
    
    const existingOther = await getDocs(otherCatQuery);
    
    if (existingOther.size > 0) {
      console.log('✅ "Other" breed for cats already exists in Firebase');
    } else {
      console.log('➕ Adding "other" breed for cats...');
      
      await addDoc(breedsRef, {
        name: 'other',
        type: 'cat',
        labels: { 
          en: 'other', 
          he: 'אחר' 
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Successfully added "other" breed for cats!');
    }
    
    // Show current cat breeds count
    const allCatBreeds = await getDocs(query(breedsRef, where('type', '==', 'cat')));
    console.log(`📊 Total cat breeds in Firebase: ${allCatBreeds.size}`);
    
    // Check if "other" is now present
    const otherCheck = await getDocs(query(
      breedsRef, 
      where('type', '==', 'cat'),
      where('name', '==', 'other')
    ));
    
    if (otherCheck.size > 0) {
      console.log('🎉 Confirmed: "Other" option is now available for cats!');
    } else {
      console.log('❌ Issue: "Other" option still not found for cats');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating Firebase breeds:', error);
    process.exit(1);
  }
}

updateFirebaseBreeds();
