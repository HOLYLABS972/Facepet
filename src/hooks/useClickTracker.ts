'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

const CLICK_COUNT_KEY = 'ad_click_count';
const CLICK_THRESHOLD = 6;
const CLICK_DEBOUNCE_MS = 100; // Prevent rapid clicks from counting multiple times (reduced for faster tracking)

export function useClickTracker() {
  const [clickCount, setClickCount] = useState(0);
  const [shouldShowAd, setShouldShowAd] = useState(false);
  const lastClickTimeRef = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(true);

  // Load click count from localStorage on mount
  useEffect(() => {
    try {
      const storedCount = localStorage.getItem(CLICK_COUNT_KEY);
      if (storedCount) {
        const count = parseInt(storedCount, 10);
        setClickCount(count || 0);
        console.log('[ClickTracker] Loaded click count from storage:', count || 0);
      }
    } catch (error) {
      console.error('Error loading click count:', error);
    }
  }, []);

  // Track all clicks globally
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Skip if tracking is disabled (e.g., when ad is showing)
      if (!isTrackingRef.current) return;

      // Get the clicked element
      const target = event.target as HTMLElement;
      
      // Skip clicks on certain elements (like ad close buttons, modals, etc.)
      if (
        target.closest('[data-no-track]') ||
        target.closest('[role="dialog"]') ||
        target.closest('.ad-full-page') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Debounce rapid clicks (but allow counting if enough time has passed)
      const now = Date.now();
      if (now - lastClickTimeRef.current < CLICK_DEBOUNCE_MS) {
        console.log('[ClickTracker] Click debounced, too soon after last click');
        return;
      }
      lastClickTimeRef.current = now;

      try {
        // Get current count from localStorage to ensure we have the latest value
        const storedCount = localStorage.getItem(CLICK_COUNT_KEY);
        const currentCount = storedCount ? parseInt(storedCount, 10) : 0;
        
        // Increment click count
        const newCount = currentCount + 1;
        console.log(`[ClickTracker] Click detected on ${target.tagName}, Count: ${currentCount} -> ${newCount}`);
        
        setClickCount(newCount);
        localStorage.setItem(CLICK_COUNT_KEY, newCount.toString());

        // Check if we should show an ad (every 6 clicks)
        if (newCount >= CLICK_THRESHOLD) {
          console.log(`[ClickTracker] Threshold reached! Showing ad (${newCount} clicks)`);
          setShouldShowAd(true);
          isTrackingRef.current = false; // Stop tracking while ad is showing
        }
      } catch (error) {
        console.error('Error tracking click:', error);
      }
    };

    // Add global click listener
    document.addEventListener('click', handleClick, true); // Use capture phase to catch all clicks

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  const resetAdFlag = useCallback(() => {
    setShouldShowAd(false);
    isTrackingRef.current = true; // Resume tracking after ad is closed
  }, []);

  return {
    clickCount,
    shouldShowAd,
    resetAdFlag
  };
}

