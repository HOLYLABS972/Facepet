'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2, Share2, Trophy, Info, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Promo, Business } from '@/types/promo';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { QRCode } from 'react-qr-code';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { markPromoAsUsed, isPromoUsed } from '@/lib/firebase/user-promos';
import { motion } from 'framer-motion';
import { getYouTubeEmbedUrl } from '@/lib/utils/youtube';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

declare global {
  interface Window {
    google: any;
    initCouponMap: () => void;
  }
}

interface CouponViewPageClientProps {
  coupon: Promo;
  business: Business | null;
  businesses?: Business[];
}

export default function CouponViewPageClient({ coupon, business, businesses = [] }: CouponViewPageClientProps) {
  const t = useTranslations('pages.PromosPage');
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();
  const [isUsingCoupon, setIsUsingCoupon] = useState(false);
  const [isUsed, setIsUsed] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [couponUrl, setCouponUrl] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const initCallbackRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Set mounted state and coupon URL only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/${locale}/promos/${coupon.id}${business ? `?businessId=${business.id}` : ''}`;
      setCouponUrl(url);
    }
  }, [locale, coupon.id, business]);

  // Check if coupon is already used
  useEffect(() => {
    const checkUsed = async () => {
      if (user) {
        const used = await isPromoUsed(user.uid, coupon.id);
        setIsUsed(used);
      }
    };
    checkUsed();
  }, [user, coupon.id]);

  // Initialize map with business locations
  useEffect(() => {
    // Skip if component is not mounted or no businesses
    if (!isMounted || !mapRef.current || businesses.length === 0) {
      if (businesses.length === 0) {
        setMapLoaded(true);
      }
      return () => {
        // No cleanup needed if map wasn't initialized
      };
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

      // Check if Google Maps is already loaded globally (by another component)
      const existingGlobalScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingGlobalScript || (window.google && window.google.maps)) {
        // Wait a bit for it to fully load if needed
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

          // Timeout after 5 seconds
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

      // Check if our specific script already exists
      const existingScript = document.querySelector('script[data-coupon-map]') as HTMLScriptElement;
      if (existingScript) {
        // Don't store reference - existing script might be from another component
        // Only clean up scripts we create ourselves
        if (window.google && window.google.maps) {
          if (isMountedRef.current) {
            initializeMap();
          }
        } else {
          // Wait for script to load
          intervalRef.current = setInterval(() => {
            if (window.google && window.google.maps && isMountedRef.current) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              initializeMap();
            }
          }, 100);

          // Cleanup interval after timeout
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initCouponMap`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-coupon-map', 'true');

      scriptRef.current = script;
      initCallbackRef.current = initializeMap;

      // Wrap the callback to ensure component is still mounted before executing
      window.initCouponMap = () => {
        if (isMountedRef.current && initCallbackRef.current) {
          initCallbackRef.current();
        }
      };

      // Only append if component is still mounted
      if (isMountedRef.current && document.head) {
        document.head.appendChild(script);
      }

      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        setMapLoaded(true);
      };
    };

    const initializeMap = async () => {
      // Multiple safety checks before proceeding
      if (!isMountedRef.current) {
        return;
      }

      if (!mapRef.current || !window.google) {
        return;
      }

      // Double check the ref is still valid and in the DOM
      if (!mapRef.current.parentNode || !document.body.contains(mapRef.current)) {
        console.warn('Map ref is not in DOM, skipping map initialization');
        return;
      }

      const defaultCenter = { lat: 31.7683, lng: 35.2137 }; // Default to Jerusalem
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 10,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(mapInstance);
      const geocoder = new window.google.maps.Geocoder();
      const newMarkers: any[] = [];
      const bounds = new window.google.maps.LatLngBounds();
      let geocodeCount = 0;
      const totalBusinesses = businesses.filter(b => b.contactInfo?.address).length;

      // Geocode each business address and add marker
      businesses.forEach((businessItem) => {
        const address = businessItem.contactInfo?.address;
        if (!address) {
          geocodeCount++;
          if (geocodeCount === totalBusinesses && isMountedRef.current) {
            finalizeMap();
          }
          return;
        }

        geocoder.geocode({ address }, (results, status) => {
          // Check if component is still mounted before proceeding
          if (!isMountedRef.current || !mapRef.current || !mapRef.current.parentNode) {
            return;
          }

          geocodeCount++;

          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            const position = { lat: location.lat(), lng: location.lng() };

            const marker = new window.google.maps.Marker({
              position,
              map: mapInstance,
              title: businessItem.name,
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(40, 40),
              },
            });

            // Create info window
            const phoneDisplay = businessItem.contactInfo?.phone
              ? `<p style="margin: 0; color: #666; font-size: 14px;">Phone: ${businessItem.contactInfo.phone}</p>`
              : '';
            const addressDisplay = address
              ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${address}</p>`
              : '';
            const infoContent = '<div style="padding: 10px; max-width: 250px;">' +
              '<h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">' + businessItem.name + '</h3>' +
              addressDisplay +
              phoneDisplay +
              '</div>';

            const infoWindow = new window.google.maps.InfoWindow({
              content: infoContent,
            });

            marker.addListener('click', () => {
              // Only handle clicks if component is still mounted
              if (!isMountedRef.current) return;
              // Close other info windows
              newMarkers.forEach(m => {
                if (m.infoWindow) m.infoWindow.close();
              });
              infoWindow.open(mapInstance, marker);
            });

            newMarkers.push({ marker, infoWindow });
            bounds.extend(position);
          }

          // Finalize map when all geocoding is done, but only if still mounted
          if (geocodeCount === totalBusinesses && isMountedRef.current) {
            finalizeMap();
          }
        });
      });

      const finalizeMap = () => {
        if (!isMountedRef.current || !mapRef.current || !mapRef.current.parentNode) return;

        try {
          if (newMarkers.length > 0) {
            mapInstance.fitBounds(bounds);
            // Don't zoom in too much if only one marker
            if (newMarkers.length === 1) {
              mapInstance.setZoom(15);
            }
          } else if (totalBusinesses === 0) {
            // No businesses with addresses, just show default center
            mapInstance.setCenter(defaultCenter);
            mapInstance.setZoom(10);
          }

          // Only update state if component is still mounted
          if (isMountedRef.current && mapRef.current && mapRef.current.parentNode) {
            setMarkers(newMarkers);
            setMapLoaded(true);
          }
        } catch (e) {
          console.warn('Error finalizing map:', e);
          if (isMountedRef.current) {
            setMapLoaded(true);
          }
        }
      };
    };

    loadGoogleMaps();

    return () => {
      isMountedRef.current = false;

      // Cleanup timeouts first
      if (timeoutRef.current) {
        try {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Cleanup intervals
      if (intervalRef.current) {
        try {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Cleanup callback first to prevent new map initialization
      // Wrap callback deletion in a check to prevent race conditions
      if (window.initCouponMap && initCallbackRef.current) {
        try {
          // Only delete if this is our callback - other components might be using it
          if (window.initCouponMap === initCallbackRef.current) {
            delete window.initCouponMap;
          }
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      initCallbackRef.current = null;

      // Don't remove the script element - it can be reused by other components
      // Removing it can cause race conditions with React's DOM cleanup
      // The script will remain in the DOM but won't cause issues since we've cleared the callback
      scriptRef.current = null;

      // Cleanup markers/map LAST - after ensuring no new operations start
      // Only if container still exists (React hasn't removed it yet)
      if (markers && Array.isArray(markers) && markers.length > 0) {
        // Check if map container is still in DOM
        const containerExists = mapRef.current &&
          mapRef.current.parentNode &&
          document.body.contains(mapRef.current);

        if (containerExists) {
          markers.forEach((item) => {
            if (!item || typeof item !== 'object') return;

            try {
              if (item.infoWindow && typeof item.infoWindow.close === 'function') {
                item.infoWindow.close();
              }
            } catch (e) {
              // Ignore errors - window might already be closed
            }

            try {
              if (item.marker && typeof item.marker.setMap === 'function') {
                item.marker.setMap(null);
              }
            } catch (e) {
              // Ignore errors - marker might already be removed
            }
          });
        }
      }
    };
  }, [isMounted, businesses]);

  const handleUseCouponClick = () => {
    if (!user) {
      toast.error('Please sign in to use coupons');
      router.push('/auth');
      return;
    }

    if (isUsed) {
      toast.error('This coupon has already been used');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleUseCoupon = async () => {
    setShowConfirmDialog(false);
    setIsUsingCoupon(true);

    try {
      const result = await markPromoAsUsed(user.uid, coupon.id);

      if (result.success) {
        setIsUsed(true);
        setShowSuccessAnimation(true);
        toast.success(t('promoUsed') || 'Coupon marked as used!');

        // Hide animation and redirect after 2 seconds
        setTimeout(() => {
          setShowSuccessAnimation(false);
          // Redirect back to coupons list
          router.push(`/${locale}/promos${business ? `?businessId=${business.id}` : ''}`);
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to mark coupon as used');
      }
    } catch (error) {
      console.error('Error using coupon:', error);
      toast.error('Failed to use coupon');
    } finally {
      setIsUsingCoupon(false);
    }
  };

  const handleShare = async () => {
    if (!isMounted || !couponUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: coupon.name,
          text: coupon.description || coupon.name,
          url: couponUrl,
        });
        toast.success(t('shared') || 'Shared successfully!');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          // Fallback to clipboard
          navigator.clipboard.writeText(couponUrl);
          toast.success(t('linkCopied') || 'Link copied to clipboard!');
        }
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(couponUrl);
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
            {/* Coupon Image or Video */}
            {coupon.youtubeUrl ? (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden bg-black">
                {getYouTubeEmbedUrl(coupon.youtubeUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(coupon.youtubeUrl) || ''}
                    title={coupon.name}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <span>Video unavailable</span>
                  </div>
                )}
              </div>
            ) : coupon.imageUrl && (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                <img
                  src={coupon.imageUrl}
                  alt={coupon.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Business Locations Map */}
            {businesses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t('businessLocations') || 'Business Locations'}
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

            {/* Coupon Info */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">{coupon.name}</h1>
              {coupon.description && (
                <p className="text-gray-600 mb-4">{coupon.description}</p>
              )}
              {business && (
                <p className="text-sm text-gray-500 mb-4">{business.name}</p>
              )}
              {(coupon.startDate || coupon.endDate) && (
                <div className="text-sm text-gray-500 mb-4">
                  {coupon.startDate && (
                    <p>{t('startDate') || 'Start'}: {new Date(coupon.startDate).toLocaleDateString()}</p>
                  )}
                  {coupon.endDate && (
                    <p>{t('endDate') || 'End'}: {new Date(coupon.endDate).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center space-y-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('viewCoupon') || 'View Coupon'}</h2>
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                {isMounted && couponUrl ? (
                  <QRCode
                    value={couponUrl}
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
                {t('qrCodeDescription') || 'Scan this QR code to view this coupon'}
              </p>
            </div>

            {/* Important Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    {t('importantInfo') || 'Important Information'}
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>{t('couponUsageInfo') || 'This coupon can only be used at the shop that offers this promo'}</li>
                    <li>{t('oneTimeUse') || 'This coupon is valid for one-time use only'}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Success Animation - Prize Icon */}
            {showSuccessAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: [0, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="bg-white rounded-lg p-8 text-center max-w-sm mx-4 shadow-2xl"
                >
                  <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
                  <p className="text-2xl font-bold text-gray-900 mb-2">{t('gotPrize') || 'I got a prize!'}</p>
                  <p className="text-gray-600">{t('couponUsedSuccess') || 'Coupon used successfully!'}</p>
                </motion.div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant={isUsed ? "secondary" : "default"}
                  size="lg"
                  onClick={handleUseCouponClick}
                  disabled={isUsed || isUsingCoupon}
                  className="flex-1"
                >
                  {isUsingCoupon ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t('using') || 'Using...'}
                    </>
                  ) : isUsed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('used') || 'Used'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('use') || 'Use'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {t('share') || 'Share'}
                </Button>
              </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('confirmUse') || 'Confirm Use Coupon'}</DialogTitle>
                  <DialogDescription>
                    {t('confirmUseMessage') || `Are you sure you want to use "${coupon.name}"? This action cannot be undone.`}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={isUsingCoupon}
                  >
                    {t('cancel') || 'Cancel'}
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleUseCoupon}
                    disabled={isUsingCoupon}
                  >
                    {isUsingCoupon ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t('using') || 'Using...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t('confirm') || 'Confirm'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

