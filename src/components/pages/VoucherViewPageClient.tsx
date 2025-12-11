'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ShoppingCart, Share2, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { UserCoupon } from '@/lib/firebase/user-coupons';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { QRCode } from 'react-qr-code';
import toast from 'react-hot-toast';
import { useShopRedirect } from '@/hooks/use-shop-redirect';
import { getContactInfo, ContactInfo } from '@/lib/actions/admin';

declare global {
  interface Window {
    google: any;
    initVoucherMap: () => void;
  }
}

interface VoucherViewPageClientProps {
  userCoupon: UserCoupon;
}

export default function VoucherViewPageClient({ userCoupon }: VoucherViewPageClientProps) {
  const t = useTranslations('components.UserCoupons');
  const router = useRouter();
  const locale = useLocale();
  const coupon = userCoupon.coupon;
  const { redirectToShop } = useShopRedirect();
  const [shopUrl, setShopUrl] = useState<string>('');
  const [voucherUrl, setVoucherUrl] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const initCallbackRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // Set voucher URL only on client side to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      setVoucherUrl(`${window.location.origin}/${locale}/vouchers/${userCoupon.id}`);
    }
  }, [locale, userCoupon.id]);

  useEffect(() => {
    const fetchContactData = async () => {
      const info = await getContactInfo();
      if (info) {
        setContactInfo(info);
        if (info.storeUrl) {
          setShopUrl(info.storeUrl);
        }
      }
    };
    fetchContactData();
  }, []);

  // Initialize map with contact info address
  useEffect(() => {
    if (!isMounted || !mapRef.current || !contactInfo?.address) {
      if (!contactInfo?.address) {
        setMapLoaded(true);
      }
      return () => {};
    }

    isMountedRef.current = true;

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set');
        setMapLoaded(true);
        return;
      }

      const existingGlobalScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingGlobalScript || (window.google && window.google.maps)) {
        if (window.google && window.google.maps) {
          initializeMap();
        } else {
          intervalRef.current = setInterval(() => {
            if (window.google && window.google.maps && isMountedRef.current) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              initializeMap();
            }
          }, 100);

          timeoutRef.current = setTimeout(() => {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            if (!window.google || !window.google.maps) {
              console.error('Google Maps failed to load');
              if (isMountedRef.current) {
                setMapLoaded(true);
              }
            }
          }, 5000);
        }
        return;
      }

      const existingScript = document.querySelector('script[data-voucher-map]') as HTMLScriptElement;
      if (existingScript) {
        if (window.google && window.google.maps) {
          if (isMountedRef.current) {
            initializeMap();
          }
        } else {
          intervalRef.current = setInterval(() => {
            if (window.google && window.google.maps && isMountedRef.current) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              initializeMap();
            }
          }, 100);

          timeoutRef.current = setTimeout(() => {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }, 5000);
        }
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initVoucherMap`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-voucher-map', 'true');

      scriptRef.current = script;
      initCallbackRef.current = initializeMap;

      window.initVoucherMap = () => {
        if (isMountedRef.current && initCallbackRef.current) {
          initCallbackRef.current();
        }
      };

      if (isMountedRef.current && document.head) {
        document.head.appendChild(script);
      }

      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        setMapLoaded(true);
      };
    };

    const initializeMap = async () => {
      if (!isMountedRef.current || !mapRef.current || !window.google || !contactInfo?.address) {
        return;
      }

      if (!mapRef.current.parentNode || !document.body.contains(mapRef.current)) {
        console.warn('Map ref is not in DOM, skipping map initialization');
        return;
      }

      const defaultCenter = { lat: 31.7683, lng: 35.2137 };
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 10,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(mapInstance);
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address: contactInfo.address }, (results, status) => {
        if (!isMountedRef.current || !mapRef.current || !mapRef.current.parentNode) {
          return;
        }

        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const position = { lat: location.lat(), lng: location.lng() };

          const marker = new window.google.maps.Marker({
            position,
            map: mapInstance,
            title: contactInfo.address,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            },
          });

          const phoneDisplay = contactInfo.phone
            ? `<p style="margin: 0; color: #666; font-size: 14px;">Phone: ${contactInfo.phone}</p>`
            : '';
          const addressDisplay = contactInfo.address
            ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${contactInfo.address}</p>`
            : '';
          const infoContent = '<div style="padding: 10px; max-width: 250px;">' +
            '<h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">Store Location</h3>' +
            addressDisplay +
            phoneDisplay +
            '</div>';

          const infoWindow = new window.google.maps.InfoWindow({
            content: infoContent,
          });

          marker.addListener('click', () => {
            if (!isMountedRef.current) return;
            infoWindow.open(mapInstance, marker);
          });

          mapInstance.setCenter(position);
          mapInstance.setZoom(15);
        } else {
          console.error('Geocoding failed:', status);
          mapInstance.setCenter(defaultCenter);
          mapInstance.setZoom(10);
        }

        if (isMountedRef.current && mapRef.current && mapRef.current.parentNode) {
          setMapLoaded(true);
        }
      });
    };

    loadGoogleMaps();

    return () => {
      isMountedRef.current = false;

      if (timeoutRef.current) {
        try {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        } catch (e) {}
      }

      if (intervalRef.current) {
        try {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        } catch (e) {}
      }

      if (window.initVoucherMap && initCallbackRef.current) {
        try {
          if (window.initVoucherMap === initCallbackRef.current) {
            delete window.initVoucherMap;
          }
        } catch (e) {}
      }
      initCallbackRef.current = null;
      scriptRef.current = null;
    };
  }, [isMounted, contactInfo]);

  const handleUse = () => {
    const couponCode = coupon.description; // The coupon code is stored in description
    
    // Copy the code first
    if (couponCode) {
      navigator.clipboard.writeText(couponCode).then(() => {
        toast.success(t('codeCopied') || 'Voucher code copied to clipboard!');
      }).catch(() => {
        toast.error(t('failedToCopy') || 'Failed to copy code');
      });
    }
    
    // Then redirect to shop with the coupon code
    if (!shopUrl) {
      toast.error('Shop URL is not configured. Please contact support.');
      return;
    }
    
    redirectToShop(shopUrl, couponCode, undefined, true);
  };

  const handleShare = async () => {
    if (!isMounted || !voucherUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: coupon.name,
          text: coupon.description || coupon.name,
          url: voucherUrl,
        });
        toast.success(t('sharedSuccessfully') || 'Shared successfully!');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          // Fallback to clipboard
          navigator.clipboard.writeText(voucherUrl);
          toast.success(t('linkCopied') || 'Link copied to clipboard!');
        }
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(voucherUrl);
      toast.success(t('linkCopied') || 'Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6"
        >
          {locale === 'he' ? (
            <ArrowRight className="h-4 w-4 mr-2" />
          ) : (
            <ArrowLeft className="h-4 w-4 mr-2" />
          )}
          {t('back') || 'Back'}
        </Button>

        <Card className="overflow-hidden">
          <CardContent className="p-8">
            {/* Voucher Image */}
            {coupon.imageUrl && (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                <img
                  src={coupon.imageUrl}
                  alt={coupon.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Voucher Info */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">{coupon.name}</h1>
              {coupon.description && (
                <p className="text-gray-600 mb-4">{coupon.description}</p>
              )}
              {coupon.validFrom && coupon.validTo && isMounted && (
                <div className="text-sm text-gray-500 mb-4">
                  <p>{t('validFrom') || 'Valid from'}: {new Date(coupon.validFrom).toLocaleDateString()}</p>
                  <p>{t('validUntil') || 'Valid until'}: {new Date(coupon.validTo).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center space-y-6 mb-8">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                {isMounted && voucherUrl ? (
                  <QRCode
                    value={voucherUrl}
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
                {t('qrCodeDescription') || 'Scan this QR code to view this voucher'}
              </p>
            </div>

            {/* Store Location Map */}
            {contactInfo?.address && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t('storeLocation') || 'Store Location'}
                </h2>
                <div className="relative w-full h-96 rounded-lg border-2 border-gray-200 overflow-hidden">
                  <div
                    ref={mapRef}
                    className="w-full h-full"
                  />
                  {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-gray-600">{t('loadingMap') || 'Loading map...'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="default"
                size="lg"
                onClick={handleUse}
                className="flex-1"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t('use') || 'Use'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleShare}
                className="flex-1"
                disabled={!isMounted || !voucherUrl}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('share') || 'Share'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

