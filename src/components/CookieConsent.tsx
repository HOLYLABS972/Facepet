'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Cookie, Check, X as RejectIcon } from 'lucide-react';

interface CookieConsentProps {
  onAccept: () => void;
  onReject: () => void;
}

export default function CookieConsent({ onAccept, onReject }: CookieConsentProps) {
  const t = useTranslations('components.CookieConsent');
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem('cookieConsent');
    if (!hasConsent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('acceptCookies', 'true');
    setShowConsent(false);
    onAccept();
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    localStorage.setItem('acceptCookies', 'false');
    setShowConsent(false);
    onReject();
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/20">
      <Card className="max-w-2xl mx-auto shadow-2xl border-0 bg-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Cookie className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('title')}
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                {t('description')}
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleAccept}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('acceptAll')}
                </Button>
                
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-medium"
                >
                  <RejectIcon className="w-4 h-4 mr-2" />
                  {t('rejectAll')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
