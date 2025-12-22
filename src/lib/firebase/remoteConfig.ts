'use client';

import { getRemoteConfig, getValue, RemoteConfig } from 'firebase/remote-config';
import app from './config';

let remoteConfigInstance: RemoteConfig | null = null;

/**
 * Initialize Firebase Remote Config
 */
export function initializeRemoteConfig(): RemoteConfig {
  if (remoteConfigInstance) {
    return remoteConfigInstance;
  }

  remoteConfigInstance = getRemoteConfig(app);
  
  // Set minimum fetch interval to allow more frequent updates (default is 12 hours)
  remoteConfigInstance.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
  
  // Don't set defaultConfig - Remote Config is the single source of truth
  remoteConfigInstance.defaultConfig = {
    google_maps_api_key: '', // Empty default - must be set in Remote Config
  };

  return remoteConfigInstance;
}

/**
 * Get Google Maps API key from Firebase Remote Config only
 * No fallback to environment variables - Remote Config is the single source of truth
 */
export async function getGoogleMapsApiKey(): Promise<string> {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      // Server-side: return empty string - Remote Config is client-side only
      console.warn('⚠️ Remote Config is not available server-side. Google Maps API key must be set in Remote Config.');
      return '';
    }

    // Client-side: fetch from Remote Config
    const config = initializeRemoteConfig();
    
    // Fetch and activate config
    try {
      await config.fetchAndActivate();
    } catch (fetchError) {
      console.warn('⚠️ Failed to fetch Remote Config, using cached values:', fetchError);
      // Continue with cached/default values if fetch fails
    }

    const snapshot = getValue(config, 'google_maps_api_key');
    const apiKey = snapshot.asString();

    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
      console.error('❌ Google Maps API key is not set in Firebase Remote Config');
      return '';
    }

    // Check for known invalid keys
    if (apiKey === 'AIzaSyAwzQsbG0vO0JWzOs7UAyu0upW6Xc1KL4E') {
      console.error('❌ Invalid Google Maps API key found in Remote Config');
      return '';
    }

    console.log('✅ Using Google Maps API key from Remote Config');
    return apiKey;
  } catch (error) {
    console.error('❌ Error getting Google Maps API key from Remote Config:', error);
    return '';
  }
}

/**
 * Get Remote Config instance (for direct access if needed)
 */
export function getRemoteConfigInstance(): RemoteConfig {
  return initializeRemoteConfig();
}

