'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCode } from 'react-qr-code';
import { QrCode } from 'lucide-react';

interface QRCodeCardProps {
  url: string;
  title?: string;
  description?: string;
}

export default function QRCodeCard({ url, title, description }: QRCodeCardProps) {
  const t = useTranslations('pages.PromosPage');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const defaultTitle = title || t('viewCoupon') || 'View Coupon';
  const defaultDescription = description || t('qrCodeDescription') || 'Scan this QR code to view this coupon';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <QrCode className="h-5 w-5 text-primary" />
          {defaultTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
          {isMounted && url ? (
            <QRCode
              value={url}
              size={256}
              level="H"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 text-center max-w-md">
          {defaultDescription}
        </p>
      </CardContent>
    </Card>
  );
}
