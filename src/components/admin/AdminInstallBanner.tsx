'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInstallBannerSettings, InstallBannerSettings } from '@/lib/actions/admin';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function AdminInstallBanner() {
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
        if (typeof window !== 'undefined') {
            try {
                const dismissed = localStorage.getItem('adminInstallBannerDismissed');
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
                // Show banner if settings are enabled
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
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('adminInstallBannerDismissed', new Date().toISOString());
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
                        localStorage.setItem('adminInstallBannerDismissed', new Date().toISOString());
                    } catch (error) {
                        console.error('Error setting localStorage:', error);
                    }
                }
            }
            setDeferredPrompt(null);
        }
    };

    if (!isVisible || !settings) return null;

    return (
        <div
            className="md:hidden w-full bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg"
        >
            <div className="px-3 py-2 flex items-center gap-2">
                {settings.logoUrl && (
                    <div className="flex-shrink-0">
                        <Image
                            src={settings.logoUrl}
                            alt="Logo"
                            width={32}
                            height={32}
                            className="rounded-lg"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{settings.bannerText}</p>
                    {isIOS && (
                        <p className="text-[10px] mt-0.5 opacity-90 flex items-center">
                            {t('iosInstructionsPart1')} <Share className="inline h-2.5 w-2.5 mx-1" /> {t('iosInstructionsPart2')}
                        </p>
                    )}
                    {isDesktop && !deferredPrompt && (
                        <p className="text-[10px] mt-0.5 opacity-90">
                            {t('desktopInstructionsShort')}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {deferredPrompt && (isAndroid || isDesktop) && (
                        <Button
                            onClick={handleInstall}
                            size="sm"
                            variant="secondary"
                            className="bg-white text-primary hover:bg-gray-100 h-7 px-2 text-xs"
                        >
                            <Download className="h-3 w-3 mr-1" />
                            {t('installButton')}
                        </Button>
                    )}
                    <Button
                        onClick={handleDismiss}
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20 h-7 w-7 p-0"
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
