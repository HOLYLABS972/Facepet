#!/usr/bin/env tsx

/**
 * Test script to verify Firebase connection and basic operations
 */

import { config } from 'dotenv';
import { adminDb } from '../src/lib/firebase/admin';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase-admin/firestore';

// Load environment variables
config({ path: '.env.local' });

async function testFirebaseConnection() {
  console.log('🧪 Testing Firebase connection...');

  try {
    // Test 1: Check if we can access Firestore
    console.log('1. Testing Firestore access...');
    const testCollection = collection(adminDb, 'test');
    console.log('✅ Firestore connection successful');

    // Test 2: Create a test document
    console.log('2. Testing document creation...');
    const testDoc = await addDoc(testCollection, {
      message: 'Firebase test document',
      timestamp: new Date(),
      testId: Math.random().toString(36).substring(7)
    });
    console.log(`✅ Document created with ID: ${testDoc.id}`);

    // Test 3: Read the document
    console.log('3. Testing document reading...');
    const snapshot = await getDocs(testCollection);
    console.log(`✅ Found ${snapshot.size} documents in test collection`);

    // Test 4: Clean up test document
    console.log('4. Cleaning up test document...');
    await deleteDoc(doc(adminDb, 'test', testDoc.id));
    console.log('✅ Test document deleted');

    console.log('\n🎉 All Firebase tests passed!');
    console.log('Your Firebase configuration is working correctly.');

  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your Firebase environment variables');
    console.log('2. Verify your Firebase project is set up correctly');
    console.log('3. Make sure Firestore is enabled in your Firebase project');
    console.log('4. Check your service account permissions');
    
    process.exit(1);
  }
}

// Run the test
testFirebaseConnection().catch(console.error);
