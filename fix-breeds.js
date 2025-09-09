// Script to fix breeds collection by clearing and repopulating with proper type field
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, addDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDM3nU5ifIk5wF3kcdToVWpjDD6U5VP5Jk",
  authDomain: "facepet-48b13.firebaseapp.com",
  projectId: "facepet-48b13",
  storageBucket: "facepet-48b13.firebasestorage.app",
  messagingSenderId: "1055059508691",
  appId: "1:1055059508691:web:f530c111ec812d4e9f4326",
  measurementId: "G-ML6XD5X9C2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const breedsWithTypes = [
  // Dogs
  { name: 'Labrador Retriever', type: 'dog', labels: { en: 'Labrador Retriever', he: 'לברדור רטריבר' } },
  { name: 'Golden Retriever', type: 'dog', labels: { en: 'Golden Retriever', he: 'גולדן רטריבר' } },
  { name: 'German Shepherd', type: 'dog', labels: { en: 'German Shepherd', he: 'רועה גרמני' } },
  { name: 'French Bulldog', type: 'dog', labels: { en: 'French Bulldog', he: 'בולדוג צרפתי' } },
  { name: 'Bulldog', type: 'dog', labels: { en: 'Bulldog', he: 'בולדוג' } },
  { name: 'Poodle', type: 'dog', labels: { en: 'Poodle', he: 'פודל' } },
  { name: 'Beagle', type: 'dog', labels: { en: 'Beagle', he: 'ביגל' } },
  { name: 'Rottweiler', type: 'dog', labels: { en: 'Rottweiler', he: 'רוטוויילר' } },
  { name: 'Siberian Husky', type: 'dog', labels: { en: 'Siberian Husky', he: 'האסקי סיבירי' } },
  { name: 'Border Collie', type: 'dog', labels: { en: 'Border Collie', he: 'בורדר קולי' } },
  { name: 'Pomeranian', type: 'dog', labels: { en: 'Pomeranian', he: 'פומרניאן' } },
  { name: 'Mixed Breed', type: 'dog', labels: { en: 'Mixed Breed', he: 'גזע מעורב' } },
  
  // Cats
  { name: 'Persian', type: 'cat', labels: { en: 'Persian', he: 'פרסי' } },
  { name: 'Maine Coon', type: 'cat', labels: { en: 'Maine Coon', he: 'מיין קון' } },
  { name: 'British Shorthair', type: 'cat', labels: { en: 'British Shorthair', he: 'בריטי קצר שיער' } },
  { name: 'Ragdoll', type: 'cat', labels: { en: 'Ragdoll', he: 'רגדול' } },
  { name: 'Siamese', type: 'cat', labels: { en: 'Siamese', he: 'סיאמי' } },
  { name: 'American Shorthair', type: 'cat', labels: { en: 'American Shorthair', he: 'אמריקאי קצר שיער' } },
  { name: 'Abyssinian', type: 'cat', labels: { en: 'Abyssinian', he: 'אביסיני' } },
  { name: 'Scottish Fold', type: 'cat', labels: { en: 'Scottish Fold', he: 'סקוטי מקופל אוזניים' } },
  { name: 'Sphynx', type: 'cat', labels: { en: 'Sphynx', he: 'ספינקס' } },
  { name: 'Bengal', type: 'cat', labels: { en: 'Bengal', he: 'בנגל' } },
  { name: 'Russian Blue', type: 'cat', labels: { en: 'Russian Blue', he: 'רוסי כחול' } },
  { name: 'Mixed Breed', type: 'cat', labels: { en: 'Mixed Breed', he: 'גזע מעורב' } },
];

async function fixBreedsCollection() {
  try {
    console.log('🔧 Fixing breeds collection...');
    
    // Get all existing breeds
    const breedsRef = collection(db, 'breeds');
    const snapshot = await getDocs(breedsRef);
    
    console.log(`Found ${snapshot.size} existing breeds`);
    
    // Delete all existing breeds
    console.log('🗑️ Deleting existing breeds...');
    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(doc(db, 'breeds', docSnapshot.id));
    }
    
    console.log('✅ Deleted all existing breeds');
    
    // Add breeds with proper type field
    console.log('➕ Adding breeds with proper type field...');
    for (const breed of breedsWithTypes) {
      await addDoc(breedsRef, breed);
    }
    
    console.log(`✅ Added ${breedsWithTypes.length} breeds with proper type field`);
    console.log('🎉 Breeds collection fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing breeds collection:', error);
  }
}

fixBreedsCollection();
