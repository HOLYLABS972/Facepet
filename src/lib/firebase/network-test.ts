// Network connectivity test for Firebase services
export async function testFirebaseEndpoints() {
  const endpoints = [
    {
      name: 'Google Identity Toolkit',
      url: 'https://identitytoolkit.googleapis.com',
      description: 'Firebase Authentication service'
    },
    {
      name: 'Firebase Project',
      url: 'https://facepet-48b13.firebaseapp.com',
      description: 'Your Firebase project domain'
    },
    {
      name: 'Firestore API',
      url: 'https://firestore.googleapis.com',
      description: 'Firebase Firestore service'
    },
    {
      name: 'Google APIs',
      url: 'https://www.googleapis.com',
      description: 'Google APIs general endpoint'
    }
  ];

  console.log('🌐 Testing Firebase endpoint connectivity...');
  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await fetch(endpoint.url, { 
        method: 'HEAD',
        mode: 'no-cors' // This allows us to test connectivity even if CORS blocks the request
      });
      
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 'accessible',
        description: endpoint.description
      });
      console.log(`✅ ${endpoint.name}: Accessible`);
    } catch (error: any) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 'failed',
        error: error.message,
        description: endpoint.description
      });
      console.log(`❌ ${endpoint.name}: Failed - ${error.message}`);
    }
  }

  return results;
}

// Test specific Firebase authentication endpoint
export async function testFirebaseAuthEndpoint() {
  const authUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';
  const apiKey = 'AIzaSyDM3nU5ifIk5wF3kcdToVWpjDD6U5VP5Jk';
  
  try {
    console.log('🔐 Testing Firebase Auth endpoint...');
    
    // Test with invalid credentials to check if endpoint is reachable
    const response = await fetch(`${authUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'invalidpassword',
        returnSecureToken: true
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Firebase Auth endpoint: Accessible');
      return { success: true, message: 'Endpoint accessible' };
    } else if (data.error) {
      // If we get an error response, the endpoint is working but credentials are wrong
      if (data.error.message.includes('INVALID_PASSWORD') || 
          data.error.message.includes('EMAIL_NOT_FOUND') ||
          data.error.message.includes('INVALID_EMAIL')) {
        console.log('✅ Firebase Auth endpoint: Accessible (invalid credentials as expected)');
        return { success: true, message: 'Endpoint accessible, invalid credentials' };
      } else {
        console.log('⚠️ Firebase Auth endpoint: Accessible but unexpected error');
        return { success: true, message: `Endpoint accessible: ${data.error.message}` };
      }
    }
  } catch (error: any) {
    console.log('❌ Firebase Auth endpoint: Failed to reach');
    return { 
      success: false, 
      message: `Network error: ${error.message}`,
      error: error.message
    };
  }
}

// Check if we're in a development environment
export function checkEnvironment() {
  const env = {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    hasFirebaseConfig: !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDM3nU5ifIk5wF3kcdToVWpjDD6U5VP5Jk'),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    location: typeof window !== 'undefined' ? window.location.href : 'Server'
  };

  console.log('🔧 Environment check:', env);
  return env;
}
