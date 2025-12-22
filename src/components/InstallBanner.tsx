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
    if (isStandalone) return;

    // Detect platform
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    
    // Only show banner on mobile devices
    if (!isMobile) return;
    
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
          if (daysSinceDismissed < 7) return;
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }

    // Always show banner on mobile
    setIsVisible(true);

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
    if (deferredPrompt) {
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
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">התקינו את האפליקציה של Chapiz</p>
          {isIOS && (
            <p className="text-xs mt-1 opacity-90">
              הקש על <Share className="inline h-3 w-3 mx-1" /> ואז &quot;הוסף למסך הבית&quot;
            </p>
          )}
          {isAndroid && !deferredPrompt && (
            <p className="text-xs mt-1 opacity-90">
              פתח תפריט ⋮ ובחר &quot;הוסף למסך הבית&quot;
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Only show install button on Android when native prompt is available */}
          {deferredPrompt && (
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
