'use client';

import { useState, useEffect } from 'react';
import { getGoogleMapsApiKey } from '@/lib/firebase/remoteConfig';

/**
 * Hook to get Google Maps API key from Firebase Remote Config only
 * No fallback to environment variables - Remote Config is the single source of truth
 */
export function useGoogleMapsApiKey(): string | null {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchApiKey = async () => {
      try {
        const key = await getGoogleMapsApiKey();
        // Only set if key is valid
        if (isMounted && key && key.trim() !== '') {
          setApiKey(key);
        } else if (isMounted) {
          console.error('❌ Invalid or missing Google Maps API key from Remote Config');
        }
      } catch (error) {
        console.error('❌ Error fetching Google Maps API key from Remote Config:', error);
      }
    };

    fetchApiKey();

    return () => {
      isMounted = false;
    };
  }, []);

  return apiKey;
}

