/**
 * Script to set Google Maps API key in Firebase Remote Config
 * 
 * Usage:
 *   npx tsx scripts/set-google-maps-api-key-remote-config.ts YOUR_API_KEY
 * 
 * Or set GOOGLE_MAPS_API_KEY environment variable:
 *   GOOGLE_MAPS_API_KEY=your_key npx tsx scripts/set-google-maps-api-key-remote-config.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getRemoteConfig } from 'firebase-admin/remote-config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function setGoogleMapsApiKey() {
  const apiKey = process.argv[2] || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: Google Maps API key not provided');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/set-google-maps-api-key-remote-config.ts YOUR_API_KEY');
    console.log('  or set GOOGLE_MAPS_API_KEY environment variable');
    process.exit(1);
  }

  try {
    // Initialize Firebase Admin
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'facepet-48b13';

    let app;
    if (getApps().length === 0) {
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
          projectId,
        });
      } else {
        console.log('⚠️  Using default credentials. Make sure you have Firebase Admin SDK credentials set up.');
        app = initializeApp({
          projectId,
        });
      }
    } else {
      app = getApps()[0];
    }

    console.log('✅ Firebase Admin initialized');

    // Get Remote Config instance
    const remoteConfig = getRemoteConfig();
    console.log('✅ Remote Config instance created');

    // Get current template
    const template = await remoteConfig.getTemplate();
    console.log('✅ Retrieved current Remote Config template');

    // Check if parameter exists, if not create it
    if (!template.parameters['google_maps_api_key']) {
      template.parameters['google_maps_api_key'] = {
        defaultValue: {
          value: apiKey,
        },
        valueType: 'STRING',
        description: 'Google Maps API key for client-side map rendering',
      };
      console.log('✅ Created new parameter: google_maps_api_key');
    } else {
      // Update existing parameter
      template.parameters['google_maps_api_key'].defaultValue = {
        value: apiKey,
      };
      console.log('✅ Updated existing parameter: google_maps_api_key');
    }

    // Publish the template
    const updatedTemplate = await remoteConfig.publishTemplate(template);
    console.log('✅ Published Remote Config template');
    console.log(`\n🎉 Successfully set Google Maps API key in Firebase Remote Config!`);
    console.log(`\n📝 Note: The key will be available after Remote Config fetches the new values (typically within a few minutes).`);
    console.log(`   You can also force a fetch by calling fetchAndActivate() in your app.`);

  } catch (error: any) {
    console.error('❌ Error setting Google Maps API key:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n💡 Make sure your Firebase Admin credentials have Remote Config Admin permissions.');
    } else if (error.message?.includes('credential')) {
      console.error('\n💡 Make sure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set in your .env.local file.');
    }
    
    process.exit(1);
  }
}

// Run the script
setGoogleMapsApiKey().catch(console.error);



