# Google Maps API Key in Firebase

This document explains how to store and retrieve the Google Maps API key from Firebase.

## Overview

The Google Maps API key can now be stored in Firebase instead of (or in addition to) environment variables. This provides:
- Centralized configuration management
- Ability to update the key without redeploying
- Better control and monitoring

## Setup Options

### Option 1: Firebase Remote Config (Recommended)

Remote Config is designed for application configuration values like API keys.

#### Step 1: Set up Remote Config in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Remote Config** (under Build section)
4. Click **Add parameter**
5. Create a parameter with:
   - **Parameter key**: `google_maps_api_key`
   - **Default value**: Your Google Maps API key
   - **Value type**: String
6. Click **Publish changes**

#### Step 2: Set the key programmatically (Alternative)

You can also use the provided script to set the key:

```bash
# Method 1: Pass as argument
npx tsx scripts/set-google-maps-api-key-remote-config.ts YOUR_API_KEY

# Method 2: Use environment variable
GOOGLE_MAPS_API_KEY=your_key npx tsx scripts/set-google-maps-api-key-remote-config.ts
```

**Note**: The script requires Firebase Admin credentials in your `.env.local`:
```
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_PROJECT_ID=facepet-48b13
```

### Option 2: Firestore (Simpler Alternative)

If Remote Config seems complex, you can store the key in Firestore:

#### Step 1: Create a Firestore document

1. Go to Firebase Console → Firestore Database
2. Create a collection called `config` (if it doesn't exist)
3. Create a document with ID `googleMapsApiKey`
4. Add a field:
   - **Field name**: `apiKey`
   - **Type**: string
   - **Value**: Your Google Maps API key

#### Step 2: Update the code (if using Firestore)

If you prefer Firestore, you can modify `src/lib/firebase/remoteConfig.ts` to use Firestore instead:

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

export async function getGoogleMapsApiKey(): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    }

    const docRef = doc(db, 'config', 'googleMapsApiKey');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const apiKey = docSnap.data().apiKey;
      if (apiKey && apiKey.trim() !== '') {
        return apiKey;
      }
    }

    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  } catch (error) {
    console.error('Error getting Google Maps API key from Firestore:', error);
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  }
}
```

## Usage in Components

The Google Maps API key is automatically fetched from Firebase Remote Config when components use the `useGoogleMapsApiKey` hook:

```typescript
import { useGoogleMapsApiKey } from '@/hooks/useGoogleMapsApiKey';

function MyComponent() {
  const apiKey = useGoogleMapsApiKey();
  
  // Component will wait for API key to load
  // Falls back to NEXT_PUBLIC_GOOGLE_MAPS_API_KEY if Remote Config fails
}
```

## Fallback Behavior

The implementation includes fallback behavior:
1. **First**: Try to fetch from Firebase Remote Config
2. **Fallback**: Use `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable
3. **Server-side**: Always uses environment variables (Remote Config is client-side only)

## Security Note

⚠️ **Important**: Google Maps API keys are meant to be public (they're used in client-side code). They're protected by:
- Domain restrictions (set in Google Cloud Console)
- API restrictions (limit which APIs can be used)
- Usage quotas and billing limits

Storing them in Firebase Remote Config is fine since they're already exposed in your client-side bundle when using environment variables.

## Updating the Key

### Via Firebase Console:
1. Go to Remote Config → Edit template
2. Update the `google_maps_api_key` parameter value
3. Publish changes
4. The app will fetch the new value on next load (or after cache expires)

### Via Script:
```bash
npx tsx scripts/set-google-maps-api-key-remote-config.ts NEW_API_KEY
```

## Troubleshooting

### Key not loading from Remote Config:
- Check that Remote Config is enabled in Firebase Console
- Verify the parameter key is exactly `google_maps_api_key`
- Check browser console for errors
- Ensure Firebase is properly initialized

### Fallback to environment variable:
- This is expected behavior if Remote Config fails
- Check your `.env.local` file has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` set




