'use client';

import { useState, useEffect } from 'react';
import { Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      console.log('InstallBanner: App is in standalone mode, hiding banner');
      return;
    }

    // Detect platform
    const userAgent = navigator.userAgent;
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768; // md breakpoint
    
    // Show banner on mobile devices OR small screens (for testing)
    const shouldShow = isMobileDevice || isSmallScreen;
    
    if (!shouldShow) {
      console.log('InstallBanner: Not mobile device and not small screen, hiding banner');
      return;
    }
    
    setIsIOS(/iPhone|iPad|iPod/i.test(userAgent));
    setIsAndroid(/Android/i.test(userAgent));

    // Check if user dismissed the banner before
    if (typeof window !== 'undefined') {
      try {
        const dismissed = localStorage.getItem('installBannerDismissed');
        if (dismissed) {
          // Check if dismissed more than 7 days ago
          const dismissedDate = new Date(dismissed);
          const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < 7) {
            console.log('InstallBanner: Banner was dismissed recently, hiding');
            return;
          }
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }

    // Show banner
    console.log('InstallBanner: Showing banner');
    setIsVisible(true);

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also listen for window resize to show/hide on small screens
    const handleResize = () => {
      const currentIsStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (currentIsStandalone) return;

      const currentIsSmallScreen = window.innerWidth <= 768;
      const currentIsMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (currentIsSmallScreen || currentIsMobileDevice) {
        // Re-check visibility on resize
        try {
          const dismissed = localStorage.getItem('installBannerDismissed');
          if (!dismissed) {
            setIsVisible(true);
          } else {
            const dismissedDate = new Date(dismissed);
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed >= 7) {
              setIsVisible(true);
            }
          }
        } catch (error) {
          console.error('Error checking localStorage on resize:', error);
        }
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('installBannerDismissed', new Date().toISOString());
      } catch (error) {
        console.error('Error setting localStorage:', error);
      }
    }
  };

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS: Download mobileconfig file
      const link = document.createElement('a');
      link.href = '/Chapiz.mobileconfig';
      link.download = 'Chapiz.mobileconfig';
      link.click();
      setIsVisible(false);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('installBannerDismissed', new Date().toISOString());
        } catch (error) {
          console.error('Error setting localStorage:', error);
        }
      }
    } else if (deferredPrompt) {
      // Android or Desktop: Use the deferred prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('installBannerDismissed', new Date().toISOString());
          } catch (error) {
            console.error('Error setting localStorage:', error);
          }
        }
      }
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    if (isVisible) {
      // Add class to body to adjust layout
      document.body.classList.add('install-banner-visible');
      return () => {
        document.body.classList.remove('install-banner-visible');
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-[45] bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">התקינו את האפליקציה של Chapiz</p>
          {isIOS && (
            <p className="text-xs mt-1 opacity-90">
              לחץ על &quot;הורד&quot; כדי להתקין את פרופיל התצורה או הקש על <Share className="inline h-3 w-3 mx-1" /> ואז &quot;הוסף למסך הבית&quot;
            </p>
          )}
          {isAndroid && !deferredPrompt && (
            <p className="text-xs mt-1 opacity-90">
              פתח תפריט ⋮ ובחר &quot;הוסף למסך הבית&quot;
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Show install button on iOS (mobileconfig) or Android (when native prompt is available) */}
          {(isIOS || deferredPrompt) && (
            <Button
              onClick={handleInstall}
              size="sm"
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-100"
            >
              <Download className="h-4 w-4 mr-1" />
              הורד
            </Button>
          )}
          {/* Always show dismiss button */}
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
}
