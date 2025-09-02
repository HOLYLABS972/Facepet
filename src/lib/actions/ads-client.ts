'use client';

import { Ad } from '@/hooks/useRandomAd';
import { fetchRandomAd } from './ads-server';

/**
 * Client-side wrapper for the server action to fetch a random ad
 * This allows for error handling and type safety in the client component
 */
export async function getRandomAdClient(): Promise<Ad | null> {
  try {
    const ad = await fetchRandomAd();

    if (!ad) {
      return null;
    }

    return {
      id: ad.id,
      type: ad.type,
      content: ad.content,
      duration: ad.duration || 5
    };
  } catch (error) {
    console.error('Error fetching random ad:', error);
    return null;
  }
}
