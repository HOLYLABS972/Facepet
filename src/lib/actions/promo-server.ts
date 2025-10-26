'use server';

import { getRandomActivePromo } from './admin';
import { Promo } from '@/types/promo';

/**
 * Server action to fetch a random promo
 * Can be called directly from client components
 */
export async function fetchRandomPromo(): Promise<Promo | null> {
  try {
    const promo = await getRandomActivePromo();
    return promo;
  } catch (error) {
    console.error('Error in fetchRandomPromo server action:', error);
    return null;
  }
}

