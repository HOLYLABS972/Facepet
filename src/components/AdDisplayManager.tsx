'use client';

import { useState, useEffect } from 'react';
import { useClickTracker } from '@/hooks/useClickTracker';
import { usePetId } from '@/hooks/use-pet-id';
import { fetchRandomAd } from '@/lib/actions/ads-server';
import AdFullPage from './get-started/AdFullPage';
import { usePathname } from 'next/navigation';
import { getYouTubeVideoId } from '@/lib/utils/youtube';
import { useAuth } from '@/contexts/AuthContext';

export default function AdDisplayManager() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { shouldShowAd, resetAdFlag } = useClickTracker();
  const { petId } = usePetId();
  const [ad, setAd] = useState<any | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Don't show ads for non-authenticated users
  if (!user) {
    return null;
  }

  // Check if we're on a pet profile page (don't show click-based ads here)
  const isPetProfilePage = pathname?.match(/\/pet\/[^\/]+$/) !== null;
  // Check if we're on an admin page (don't show ads here)
  const isAdminPage = pathname?.includes('/admin') || false;

  // Debug logging
  useEffect(() => {
    console.log('[AdDisplayManager] State:', { shouldShowAd, petId, showAd, isLoading });
  }, [shouldShowAd, petId, showAd, isLoading]);

  // Fetch promo when we should show an ad and pet exists
  useEffect(() => {
    const fetchPromo = async () => {
      // Don't show click-based ads on pet profile pages (they have their own mandatory ad)
      // Also don't show ads on admin pages
      if (isPetProfilePage || isAdminPage) {
        console.log('[AdDisplayManager] Skipping click-based ad on excluded page');
        return;
      }

      console.log('[AdDisplayManager] Checking conditions:', { shouldShowAd, petId, showAd, isLoading, isPetProfilePage });

      // Check if petId exists in localStorage (might be set but not loaded yet)
      const storedPetId = typeof window !== 'undefined' ? localStorage.getItem('petId') : null;
      const hasPetId = petId || storedPetId;

      console.log('[AdDisplayManager] Pet ID check:', { petId, storedPetId, hasPetId });

      // Only show ads if pet details exist (petId is set in localStorage or state)
      if (shouldShowAd && hasPetId && !showAd && !isLoading) {
        console.log('[AdDisplayManager] Fetching ad...');
        setIsLoading(true);
        try {
          const randomAd = await fetchRandomAd();
          console.log('[AdDisplayManager] Fetched ad:', randomAd);

          if (randomAd && randomAd.content) {
            setAd(randomAd);
            setShowAd(true);
            console.log('[AdDisplayManager] Ad will be displayed');
            // Reset click count when ad is successfully shown
            try {
              localStorage.setItem('ad_click_count', '0');
              console.log('[AdDisplayManager] Click count reset after ad shown');
            } catch (error) {
              console.error('[AdDisplayManager] Error resetting click count:', error);
            }
          } else {
            console.log('[AdDisplayManager] No ad available or no content');
            // No ad available, reset the flag but keep the count (user will see ad next time)
            resetAdFlag();
          }
        } catch (error) {
          console.error('[AdDisplayManager] Error fetching ad:', error);
          resetAdFlag();
        } finally {
          setIsLoading(false);
        }
      } else if (shouldShowAd && !hasPetId) {
        console.log('[AdDisplayManager] Should show ad but no petId found in localStorage or state');
        resetAdFlag();
      }
    };

    fetchPromo();
  }, [shouldShowAd, petId, showAd, isLoading, resetAdFlag, isPetProfilePage, isAdminPage]);

  const handleAdClose = () => {
    setShowAd(false);
    setAd(null);
    resetAdFlag();
    // Reset click count after ad is closed
    try {
      localStorage.setItem('ad_click_count', '0');
      console.log('[AdDisplayManager] Click count reset after ad closed');
    } catch (error) {
      console.error('[AdDisplayManager] Error resetting click count:', error);
    }
  };

  // Show ad if we have an ad with content
  if (showAd && ad && ad.content) {
    // Detect if content is a YouTube URL
    const isYouTube = ad.content.includes('youtube.com') || ad.content.includes('youtu.be') || getYouTubeVideoId(ad.content) !== null;
    const adType = isYouTube ? 'youtube' : (ad.type || 'image');
    
    return (
      <AdFullPage
        type={adType}
        time={ad.duration || 5}
        content={ad.content}
        youtubeUrl={isYouTube ? ad.content : undefined}
        onClose={handleAdClose}
      />
    );
  }

  return null;
}

