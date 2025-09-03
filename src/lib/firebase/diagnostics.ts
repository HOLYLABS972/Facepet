// Firebase connectivity diagnostics
import { auth, db } from './config';

export async function runFirebaseDiagnostics() {
  console.log('🔍 Running Firebase Diagnostics...');
  
  const results = {
    networkConnectivity: false,
    firebaseConfig: false,
    authService: false,
    firestoreService: false,
    errors: [] as string[]
  };

  // 1. Check network connectivity to Firebase
  try {
    console.log('🌐 Testing network connectivity...');
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDM3nU5ifIk5wF3kcdToVWpjDD6U5VP5Jk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
        returnSecureToken: true
      })
    });
    
    // Even if auth fails, if we get a response, network is working
    results.networkConnectivity = true;
    console.log('✅ Network connectivity: OK');
  } catch (error: any) {
    results.networkConnectivity = false;
    results.errors.push(`Network error: ${error.message}`);
    console.error('❌ Network connectivity: FAILED', error.message);
  }

  // 2. Check Firebase configuration
  try {
    console.log('⚙️ Checking Firebase configuration...');
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDM3nU5ifIk5wF3kcdToVWpjDD6U5VP5Jk",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "facepet-48b13.firebaseapp.com",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "facepet-48b13",
    };
    
    if (config.apiKey && config.authDomain && config.projectId) {
      results.firebaseConfig = true;
      console.log('✅ Firebase configuration: OK');
      console.log('📋 Config details:', {
        authDomain: config.authDomain,
        projectId: config.projectId,
        apiKeyLength: config.apiKey.length
      });
    } else {
      results.firebaseConfig = false;
      results.errors.push('Firebase configuration missing required fields');
      console.error('❌ Firebase configuration: INCOMPLETE');
    }
  } catch (error: any) {
    results.firebaseConfig = false;
    results.errors.push(`Config error: ${error.message}`);
    console.error('❌ Firebase configuration: FAILED', error.message);
  }

  // 3. Check Auth service
  try {
    console.log('🔐 Testing Firebase Auth service...');
    if (auth && auth.app) {
      results.authService = true;
      console.log('✅ Firebase Auth service: OK');
    } else {
      results.authService = false;
      results.errors.push('Firebase Auth service not initialized');
      console.error('❌ Firebase Auth service: NOT INITIALIZED');
    }
  } catch (error: any) {
    results.authService = false;
    results.errors.push(`Auth service error: ${error.message}`);
    console.error('❌ Firebase Auth service: FAILED', error.message);
  }

  // 4. Check Firestore service
  try {
    console.log('🗄️ Testing Firestore service...');
    if (db && db.app) {
      results.firestoreService = true;
      console.log('✅ Firestore service: OK');
    } else {
      results.firestoreService = false;
      results.errors.push('Firestore service not initialized');
      console.error('❌ Firestore service: NOT INITIALIZED');
    }
  } catch (error: any) {
    results.firestoreService = false;
    results.errors.push(`Firestore service error: ${error.message}`);
    console.error('❌ Firestore service: FAILED', error.message);
  }

  // 5. Test DNS resolution
  try {
    console.log('🌍 Testing DNS resolution...');
    const testUrl = 'https://facepet-48b13.firebaseapp.com';
    const response = await fetch(testUrl, { method: 'HEAD' });
    console.log('✅ DNS resolution: OK');
  } catch (error: any) {
    results.errors.push(`DNS resolution error: ${error.message}`);
    console.error('❌ DNS resolution: FAILED', error.message);
  }

  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY:');
  console.log('========================');
  console.log(`Network Connectivity: ${results.networkConnectivity ? '✅' : '❌'}`);
  console.log(`Firebase Config: ${results.firebaseConfig ? '✅' : '❌'}`);
  console.log(`Auth Service: ${results.authService ? '✅' : '❌'}`);
  console.log(`Firestore Service: ${results.firestoreService ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 ERRORS FOUND:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  return results;
}

// Quick connectivity test
export async function quickConnectivityTest() {
  try {
    console.log('🚀 Quick connectivity test...');
    const response = await fetch('https://www.google.com', { method: 'HEAD' });
    console.log('✅ Internet connectivity: OK');
    return true;
  } catch (error) {
    console.error('❌ Internet connectivity: FAILED', error);
    return false;
  }
}
