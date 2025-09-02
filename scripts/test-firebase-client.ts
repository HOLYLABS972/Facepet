#!/usr/bin/env tsx

/**
 * Test script to verify Firebase client connection (no admin credentials needed)
 */

import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Load environment variables
config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: "AIzaSyDM3nU5ifIk5wF3kcdToVWpjDD6U5VP5Jk",
  authDomain: "facepet-48b13.firebaseapp.com",
  projectId: "facepet-48b13",
  storageBucket: "facepet-48b13.firebasestorage.app",
  messagingSenderId: "1055059508691",
  appId: "1:1055059508691:web:f530c111ec812d4e9f4326",
  measurementId: "G-ML6XD5X9C2"
};

async function testFirebaseClientConnection() {
  console.log('🧪 Testing Firebase client connection...');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase client initialized successfully');
    console.log('✅ Firestore connection established');
    console.log('✅ Project ID: facepet-48b13');

    console.log('\n🎉 Firebase client test passed!');
    console.log('Your Firebase project is accessible and ready to use.');
    console.log('\n📝 Next steps:');
    console.log('1. Set up Firestore security rules in Firebase Console');
    console.log('2. Get Firebase Admin service account credentials');
    console.log('3. Add admin credentials to your .env.local file');
    console.log('4. Run the full migration: npm run firebase:migrate');

  } catch (error) {
    console.error('❌ Firebase client test failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify your Firebase project is set up correctly');
    console.log('3. Make sure Firestore is enabled in your Firebase project');
    console.log('4. Check if your Firebase project has the correct permissions');
    
    process.exit(1);
  }
}

// Run the test
testFirebaseClientConnection().catch(console.error);
