'use client';

import { getRandomAdClient } from '@/lib/actions/ads-client';
import { useCallback, useEffect, useState } from 'react';

export interface Ad {
  id: string;
  type: 'image' | 'video';
  content: string;
  duration: number;
}

/**
 * Hook that fetches a random active ad from the ads management system using server actions
 *
 * @param initialAd Optional ad to show immediately (from server components)
 * @param showAdChance Probability (0-1) that an ad should be shown
 * @returns Object containing the ad data and controls
 */
export function useRandomAd(initialAd?: Ad | null, showAdChance = 1) {
  const [adData, setAdData] = useState<Ad | null>(initialAd || null);
  const [showAd, setShowAd] = useState(!!initialAd);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to close the ad
  const handleAdClose = useCallback(() => {
    setShowAd(false);
  }, []);

  // Function to manually fetch a new ad using server action
  const fetchRandomAd = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch from server
      const ad = await getRandomAdClient();

      if (ad && ad.content) {
        const adWithDefaults = {
          id: ad.id,
          type: ad.type,
          content: ad.content,
          duration: ad.duration || 5 // Default duration if not specified
        };

        setAdData(adWithDefaults);
        setShowAd(true);
      } else {
        // No ad available or invalid data
        setAdData(null);
        setShowAd(false);
      }
    } catch (err) {
      console.error('Error fetching random ad:', err);
      setError(
        err instanceof Error ? err.message : 'Unknown error fetching ad'
      );
      setAdData(null);
      setShowAd(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // On component mount, maybe fetch an ad based on probability
  useEffect(() => {
    // If we already have an initial ad, don't fetch another one
    if (initialAd) return;

    // Determine if we should show an ad based on the probability
    const shouldShowAd = Math.random() <= showAdChance;

    if (shouldShowAd) {
      fetchRandomAd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAd, showAdChance]); // Removed fetchRandomAd to prevent infinite loop

  return {
    adData,
    showAd,
    isLoading,
    error,
    handleAdClose,
    fetchRandomAd
  };
}
