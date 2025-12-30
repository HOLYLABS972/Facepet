'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Business } from '@/types/promo';
import { ContactInfo } from '@/lib/actions/admin';

interface MapCardProps {
  businesses?: Business[];
  contactInfo?: ContactInfo | null;
  title?: string;
}

declare global {
  interface Window {
    google: any;
    initMapCard: () => void;
  }
}

export default function MapCard({ businesses = [], contactInfo, title }: MapCardProps) {
  const t = useTranslations('pages.PromosPage');
  const router = useRouter();
  const locale = useLocale();
  const googleMapsApiKey = 'AIzaSyAjx6NIRePitcFdZjH2kE0z-zSAy8etaUE';
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const initCallbackRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  const defaultTitle = title || (businesses.length > 0 
    ? (t('businessLocations') || 'Business Locations')
    : (t('storeLocation') || 'Store Location'));

  // Initialize map
  useEffect(() => {

    // Always initialize map, even if no businesses/contact info
    if (!mapRef.current) {
      console.log('⚠️ MapCard: No mapRef.current, setting mapLoaded to true');
      setMapLoaded(true);
      return () => {};
    }

    isMountedRef.current = true;
    console.log('🗺️ MapCard: useEffect triggered, businesses:', businesses.length);

    const loadGoogleMaps = () => {
      const apiKey = googleMapsApiKey;
      const BAD_KEY = 'AIzaSyAwzQsbG0vO0JWzOs7UAyu0upW6Xc1KL4E';
      
      if (!apiKey) {
        console.error('❌ Google Maps API key is not configured');
        setMapLoaded(true);
        return;
      }

      // Aggressively remove any scripts with the wrong key
      const allMapsScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      let hasBadScript = false;
      
      allMapsScripts.forEach((s) => {
        const scriptSrc = (s as HTMLScriptElement).src;
        if (scriptSrc.includes(BAD_KEY)) {
          console.log('🗑️ Removing script with bad API key:', scriptSrc);
          s.remove();
          hasBadScript = true;
        }
      });

      // If we found a bad script, clear window.google to force fresh load
      if (hasBadScript) {
        console.log('🧹 Clearing cached Google Maps API');
        delete (window as any).google;
        delete (window as any).initMapCard;
      }

      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Check if script already exists with correct key
      const existingGlobalScript = document.querySelector('script[src*="maps.googleapis.com"]') as HTMLScriptElement;
      if (existingGlobalScript && existingGlobalScript.src.includes(apiKey)) {
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

      // Remove any existing script with wrong key
      if (existingGlobalScript && !existingGlobalScript.src.includes(apiKey)) {
        console.log('🗑️ Removing existing script with wrong key');
        existingGlobalScript.remove();
        delete (window as any).google;
        delete (window as any).initMapCard;
      }

      const existingScript = document.querySelector('script[data-map-card]') as HTMLScriptElement;
      if (existingScript && existingScript.src.includes(apiKey)) {
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

      // Remove any existing script with wrong key
      if (existingScript && !existingScript.src.includes(apiKey)) {
        console.log('🗑️ Removing existing script with wrong key');
        existingScript.remove();
        delete (window as any).google;
        delete (window as any).initMapCard;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMapCard`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-map-card', 'true');

      scriptRef.current = script;
      initCallbackRef.current = initializeMap;

      window.initMapCard = () => {
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
      if (!isMountedRef.current || !mapRef.current || !window.google) {
        console.log('⚠️ MapCard: Cannot initialize - missing requirements', {
          isMounted: isMountedRef.current,
          hasMapRef: !!mapRef.current,
          hasGoogle: !!window.google
        });
        return;
      }

      if (!mapRef.current.parentNode || !document.body.contains(mapRef.current)) {
        console.warn('⚠️ MapCard: Map ref is not in DOM, skipping map initialization', {
          hasParentNode: !!mapRef.current.parentNode,
          inBody: document.body.contains(mapRef.current)
        });
        // Try again after a short delay
        setTimeout(() => {
          if (isMountedRef.current && mapRef.current && mapRef.current.parentNode) {
            console.log('🔄 MapCard: Retrying map initialization...');
            initializeMap();
          }
        }, 100);
        return;
      }
      
      console.log('✅ MapCard: Initializing map with', businesses.length, 'businesses');

      const defaultCenter = { lat: 31.7683, lng: 35.2137 }; // Default to Jerusalem
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        gestureHandling: 'none',
        keyboardShortcuts: false,
        clickableIcons: false,
      });

      setMap(mapInstance);
      const geocoder = new window.google.maps.Geocoder();
      const newMarkers: any[] = [];
      const bounds = new window.google.maps.LatLngBounds();
      let geocodeCount = 0;

      const finalizeMap = () => {
        if (!isMountedRef.current || !mapRef.current || !mapRef.current.parentNode) return;

        try {
          if (newMarkers.length > 0) {
            mapInstance.fitBounds(bounds);
            if (newMarkers.length === 1) {
              mapInstance.setZoom(15);
            }
          } else {
            // No markers - show default center (Jerusalem)
            mapInstance.setCenter(defaultCenter);
            mapInstance.setZoom(10);
          }

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

      // Handle multiple businesses
      if (businesses.length > 0) {
        const businessesWithAddress = businesses.filter(b => b.contactInfo?.address);
        const totalBusinesses = businessesWithAddress.length;
        console.log('📍 MapCard: Processing businesses', {
          total: businesses.length,
          withAddress: totalBusinesses,
          businesses: businesses.map(b => ({ id: b.id, name: b.name, hasAddress: !!b.contactInfo?.address }))
        });

        businessesWithAddress.forEach((businessItem) => {
          const address = businessItem.contactInfo?.address;
          if (!address) {
            geocodeCount++;
            if (geocodeCount === totalBusinesses && isMountedRef.current) {
              finalizeMap();
            }
            return;
          }

          geocoder.geocode({ address }, (results, status) => {
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
                if (!isMountedRef.current) return;
                
                // Navigate directly to services page with business ID
                if (businessItem.id) {
                  router.push(`/services?businessId=${businessItem.id}`);
                }
              });

              newMarkers.push({ marker, infoWindow });
              bounds.extend(position);
            }

            if (geocodeCount === totalBusinesses && isMountedRef.current) {
              console.log('✅ MapCard: All businesses geocoded, finalizing map');
              finalizeMap();
            } else if (geocodeCount === totalBusinesses) {
              console.warn('⚠️ MapCard: All businesses geocoded but component unmounted');
            }
          });
        });
      } 
      // Handle single contact info
      else if (contactInfo?.address) {
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

            newMarkers.push({ marker, infoWindow });
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
      } else {
        // No businesses or contact info - just show default map
        finalizeMap();
      }
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

      if (window.initMapCard && initCallbackRef.current) {
        try {
          if (window.initMapCard === initCallbackRef.current) {
            delete window.initMapCard;
          }
        } catch (e) {}
      }
      initCallbackRef.current = null;
      scriptRef.current = null;

      if (markers && Array.isArray(markers) && markers.length > 0) {
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
            } catch (e) {}

            try {
              if (item.marker && typeof item.marker.setMap === 'function') {
                item.marker.setMap(null);
              }
            } catch (e) {}
          });
        }
      }
    };
  }, [businesses, contactInfo]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <MapPin className="h-5 w-5 text-primary" />
          {defaultTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-96 rounded-lg border-2 border-gray-200" style={{ overflow: 'hidden', touchAction: 'none', willChange: 'auto' }}>
          <div
            ref={mapRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%', touchAction: 'none', pointerEvents: 'auto' }}
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
      </CardContent>
    </Card>
  );
}
