'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InstallBannerSettings } from '@/lib/actions/admin';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface InstallBannerPreviewProps {
  initialData?: InstallBannerSettings | null;
}

export default function InstallBannerPreview({ initialData }: InstallBannerPreviewProps) {
  const t = useTranslations('installBanner');
  const [settings, setSettings] = useState<InstallBannerSettings | null>(initialData || null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Update settings when initialData changes
    if (initialData) {
      setSettings(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    setIsIOS(/iPhone|iPad|iPod/i.test(userAgent));
    setIsAndroid(/Android/i.test(userAgent));
    setIsDesktop(!isMobile);

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

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android or Desktop: Use the deferred prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
    }
  };

  if (!settings || !settings.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Install Banner Preview</CardTitle>
          <CardDescription>
            Enable the install banner in the settings above to see a preview here
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install Banner Preview</CardTitle>
        <CardDescription>
          This is how the install banner will appear to users on your website
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Preview Banner */}
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg">
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
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    disabled
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Info */}
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Current Platform:</strong>{' '}
              {isIOS ? 'iOS' : isAndroid ? 'Android' : isDesktop ? 'Desktop' : 'Unknown'}
            </p>
            {deferredPrompt && (
              <p className="text-green-600">
                ✓ Install prompt is available - Click the Install button above to test
              </p>
            )}
            {!deferredPrompt && (isAndroid || isDesktop) && (
              <p className="text-amber-600">
                ⚠ Install prompt not available. This may be because the app is already installed or the browser doesn&apos;t support it.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
