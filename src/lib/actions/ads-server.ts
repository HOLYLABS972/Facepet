'use server';

import { getRandomActiveAd } from './admin';

/**
 * Server action to fetch a random advertisement
 * Can be called directly from client components
 */
export async function fetchRandomAd() {
  try {
    const ad = await getRandomActiveAd();
    return ad;
  } catch (error) {
    console.error('Error in fetchRandomAd server action:', error);
    return null;
  }
}
