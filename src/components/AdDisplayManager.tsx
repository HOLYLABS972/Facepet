'use client';

import { useState, useEffect } from 'react';
import { useClickTracker } from '@/hooks/useClickTracker';
import { usePetId } from '@/hooks/use-pet-id';
import { fetchRandomPromo } from '@/lib/actions/promo-server';
import AdFullPage from './get-started/AdFullPage';
import { Promo } from '@/types/promo';
import { usePathname } from 'next/navigation';

export default function AdDisplayManager() {
  const pathname = usePathname();
  const { shouldShowAd, resetAdFlag } = useClickTracker();
  const { petId } = usePetId();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        console.log('[AdDisplayManager] Fetching promo...');
        setIsLoading(true);
        try {
          const randomPromo = await fetchRandomPromo();
          console.log('[AdDisplayManager] Fetched promo:', randomPromo);

          if (randomPromo && (randomPromo.imageUrl || randomPromo.youtubeUrl)) {
            setPromo(randomPromo);
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
            console.log('[AdDisplayManager] No promo available or no media');
            // No promo available, reset the flag but keep the count (user will see ad next time)
            resetAdFlag();
          }
        } catch (error) {
          console.error('[AdDisplayManager] Error fetching promo:', error);
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
    setPromo(null);
    resetAdFlag();
    // Reset click count after ad is closed
    try {
      localStorage.setItem('ad_click_count', '0');
      console.log('[AdDisplayManager] Click count reset after ad closed');
    } catch (error) {
      console.error('[AdDisplayManager] Error resetting click count:', error);
    }
  };

  // Show ad if we have a promo with media
  if (showAd && promo && (promo.imageUrl || promo.youtubeUrl)) {
    return (
      <AdFullPage
        type={promo.youtubeUrl ? 'youtube' : 'image'}
        time={5}
        content={promo.imageUrl || ''}
        youtubeUrl={promo.youtubeUrl}
        onClose={handleAdClose}
      />
    );
  }

  return null;
}

