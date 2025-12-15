'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInstallBannerSettings, InstallBannerSettings } from '@/lib/actions/admin';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function InstallBanner() {
  const t = useTranslations('installBanner');
  const [settings, setSettings] = useState<InstallBannerSettings | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if user dismissed the banner before
    const dismissed = localStorage.getItem('installBannerDismissed');
    if (dismissed) {
      // Check if dismissed more than 7 days ago
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Detect platform
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    setIsIOS(/iPhone|iPad|iPod/i.test(userAgent));
    setIsAndroid(/Android/i.test(userAgent));
    setIsDesktop(!isMobile);

    // Load settings
    getInstallBannerSettings().then((data) => {
      if (data && data.enabled) {
        setSettings(data);
        // Show banner if settings are enabled (works for both mobile and desktop)
        setIsVisible(true);
      }
    });

    // Listen for beforeinstallprompt event (Android and Desktop Chrome/Edge)
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
    localStorage.setItem('installBannerDismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android or Desktop: Use the deferred prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
        localStorage.setItem('installBannerDismissed', new Date().toISOString());
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS: Show instructions
      // The banner will stay visible with instructions
      // User needs to manually add to home screen
    } else if (isDesktop) {
      // Desktop: Show instructions for manual installation
      // User can use browser menu or address bar install icon
    }
  };

  useEffect(() => {
    if (isVisible && settings) {
      // Add class to body to adjust layout
      document.body.classList.add('install-banner-visible');
      return () => {
        document.body.classList.remove('install-banner-visible');
      };
    }
  }, [isVisible, settings]);

  if (!isVisible || !settings) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        {settings.logoUrl && (
          <div className="flex-shrink-0">
            <Image
              src={settings.logoUrl}
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{settings.bannerText}</p>
          {isIOS && (
            <p className="text-xs mt-1 opacity-90">
              {t('iosInstructionsPart1')} <Share className="inline h-3 w-3 mx-1" /> {t('iosInstructionsPart2')}
            </p>
          )}
          {isDesktop && !deferredPrompt && (
            <p className="text-xs mt-1 opacity-90">
              {t('desktopInstructions')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {deferredPrompt && (isAndroid || isDesktop) && (
            <Button
              onClick={handleInstall}
              size="sm"
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-100"
            >
              <Download className="h-4 w-4 mr-1" />
              {t('installButton')}
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
