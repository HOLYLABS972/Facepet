'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Phone, Star, Send, Heart, Ticket, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '../ui/drawer';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCommentsForAd, submitComment } from '@/lib/actions/admin';
import { addToFavorites, removeFromFavorites, isAdFavorited } from '@/lib/firebase/favorites';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { SERVICE_TAGS_TRANSLATIONS } from '@/lib/constants/hebrew-service-tags';

interface Service {
  id?: string;
  location: string;
  image: string;
  name: string;
  tags: string[];
  description: string;
  phone?: string;
  address?: string;
}

interface ServicesMapViewProps {
  services: Service[];
  headerContent?: React.ReactNode;
  mapFloatingControls?: React.ReactNode;
  initialHighlightedServiceId?: string;
}

declare global {
  interface Window {
    google: any;
    initServicesMap: () => void;
  }
}

interface ServiceWithCoordinates extends Service {
  coordinates?: { lat: number; lng: number };
  distance?: number;
}

const ServicesMapView: React.FC<ServicesMapViewProps> = ({ services, headerContent, mapFloatingControls, initialHighlightedServiceId }) => {
  const t = useTranslations('pages.ServicesPage');
  const router = useRouter();
  const locale = useLocale();
  const mapRef = useRef<HTMLDivElement>(null);

  // Function to translate tags for display
  const translateTag = (tag: string): string => {
    if (locale === 'en' && SERVICE_TAGS_TRANSLATIONS[tag as keyof typeof SERVICE_TAGS_TRANSLATIONS]) {
      return SERVICE_TAGS_TRANSLATIONS[tag as keyof typeof SERVICE_TAGS_TRANSLATIONS];
    }
    return tag;
  };
  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [servicesWithCoords, setServicesWithCoords] = useState<ServiceWithCoordinates[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  const [markers, setMarkers] = useState<any[]>([]);
  const [markerInfoWindows, setMarkerInfoWindows] = useState<Map<string, any>>(new Map());
  const [currentInfoWindow, setCurrentInfoWindow] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<ServiceWithCoordinates | null>(null);
  // Parse initialHighlightedServiceId - can be comma-separated for multiple businesses
  const initialHighlightedIds = initialHighlightedServiceId ? initialHighlightedServiceId.split(',') : [];
  const [highlightedServiceIds, setHighlightedServiceIds] = useState<string[]>(initialHighlightedIds);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(1);
  const [listSnapPoint, setListSnapPoint] = useState<number | string | null>(0.4);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{
    id: string;
    userName: string;
    content: string;
    rating: number;
    createdAt: Date;
  }>>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [floatingCardPosition, setFloatingCardPosition] = useState<{ x: number; y: number } | null>(null);
  const geocoderRef = useRef<any>(null);
  const { user } = useAuth();

  // Handle window resize to update isMobile state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setFloatingCardPosition(null);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  // Add CSS to hide scrollbars for service cards
  useEffect(() => {
    const styleId = 'service-cards-scrollbar-hide';

    // Only add if it doesn't already exist
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .service-cards-scroll::-webkit-scrollbar {
        display: none;
      }
    `;

    try {
      document.head.appendChild(style);
    } catch (e) {
      console.warn('Failed to add style element:', e);
    }

    // Don't remove the style element on cleanup - it's harmless to leave it
    // and removing it can cause errors if React StrictMode remounts the component
    return () => {
      // No cleanup needed - style element will persist
    };
  }, []);

  // Add CSS to hide drag handle when drawer is fullscreen on mobile and ensure fullscreen
  useEffect(() => {
    const styleId = 'drawer-fullscreen-hide-handle';

    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media (max-width: 767px) {
        [data-vaul-drawer][style*="inset: 0px"] > div:first-child,
        [data-vaul-drawer].drawer-fullscreen > div:first-child {
          display: none !important;
        }
        [data-vaul-drawer] {
          height: 100vh !important;
          max-height: 100vh !important;
          min-height: 100vh !important;
          bottom: 0 !important;
          top: 0 !important;
        }
        [data-vaul-drawer-wrapper] {
          height: 100vh !important;
        }
      }
    `;

    try {
      document.head.appendChild(style);
    } catch (e) {
      console.warn('Failed to add drawer style element:', e);
    }
  }, []);

  // Force drawer to fullscreen when it opens on mobile
  useEffect(() => {
    if (isMobile && drawerOpen) {
      const timer = setTimeout(() => {
        const drawerContent = document.querySelector('[data-vaul-drawer]') as HTMLElement;
        if (drawerContent) {
          drawerContent.style.height = '100vh';
          drawerContent.style.maxHeight = '100vh';
          drawerContent.style.minHeight = '100vh';
          drawerContent.style.bottom = '0';
          drawerContent.style.top = '0';
          drawerContent.style.transform = 'translateY(0%)';
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [drawerOpen, isMobile]);

  // Convert lat/lng to pixel coordinates for floating card positioning
  const getPixelPosition = (lat: number, lng: number): { x: number; y: number } | null => {
    if (!map || !mapRef.current) return null;

    try {
      const scale = Math.pow(2, map.getZoom() || 10);
      const worldCoordinate = project(lat, lng);

      const mapDiv = mapRef.current;
      const mapBounds = map.getBounds();
      if (!mapBounds) return null;

      const ne = mapBounds.getNorthEast();
      const sw = mapBounds.getSouthWest();
      const topRight = project(ne.lat(), ne.lng());
      const bottomLeft = project(sw.lat(), sw.lng());

      const mapWidth = mapDiv.offsetWidth;
      const mapHeight = mapDiv.offsetHeight;

      const x = ((worldCoordinate.x - bottomLeft.x) / (topRight.x - bottomLeft.x)) * mapWidth;
      const y = ((worldCoordinate.y - topRight.y) / (bottomLeft.y - topRight.y)) * mapHeight;

      return { x, y };
    } catch (error) {
      console.error('Error calculating pixel position:', error);
      return null;
    }
  };

  // Helper function to project lat/lng to world coordinates
  const project = (lat: number, lng: number) => {
    const siny = Math.sin((lat * Math.PI) / 180);
    const y = Math.log((1 + siny) / (1 - siny)) / 2;
    return {
      x: lng / 360 + 0.5,
      y: 0.5 - y / (4 * Math.PI)
    };
  };



  // Load comments for a service
  const loadComments = async (serviceId: string) => {
    setIsLoadingComments(true);
    try {
      const commentsData = await getCommentsForAd(serviceId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Check if service is favorited
  const checkIfFavorited = async (serviceId: string) => {
    if (!user || !serviceId) return;

    try {
      const favorited = await isAdFavorited(user, serviceId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking if favorited:', error);
    }
  };

  // Handle star click for rating
  const handleStarClick = (rating: number) => {
    setUserRating(rating);
  };

  // Handle submit comment
  const handleSubmitComment = async () => {
    if (!user) {
      toast.error('Please log in to write a review');
      return;
    }

    if (userRating > 0 && selectedService?.id) {
      setIsSubmittingComment(true);

      try {
        const result = await submitComment({
          adId: selectedService.id,
          adTitle: selectedService.name,
          userName: user.displayName || user.email?.split('@')[0] || 'User',
          userEmail: user.email || '',
          content: commentText.trim() || '',
          rating: userRating
        });

        if (result.success) {
          setUserRating(0);
          setCommentText('');
          setShowCommentForm(false);
          await loadComments(selectedService.id);
          toast.success('תגובתך נשלחה בהצלחה!');
        } else {
          toast.error('שגיאה בשליחת התגובה. אנא נסה שוב.');
        }
      } catch (error) {
        console.error('Error submitting comment:', error);
        toast.error('שגיאה בשליחת התגובה. אנא נסה שוב.');
      } finally {
        setIsSubmittingComment(false);
      }
    } else {
      toast.error('אנא בחר דירוג');
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Please log in to add to favorites');
      return;
    }

    if (!selectedService?.id) {
      toast.error('Service ID not available');
      return;
    }

    setIsTogglingFavorite(true);

    try {
      if (isFavorited) {
        const result = await removeFromFavorites(user, selectedService.id);
        if (result.success) {
          setIsFavorited(false);
        } else {
          toast.error('Failed to remove from favorites');
        }
      } else {
        const result = await addToFavorites(user, selectedService.id, selectedService.name, 'service');
        if (result.success) {
          setIsFavorited(true);
        } else {
          toast.error('Failed to add to favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Handle drawer close - but keep at least 20% visible
  const handleDrawerClose = (open: boolean) => {
    if (!open) {
      // On desktop, close the sidebar completely
      if (!isMobile) {
        setDrawerOpen(false);
        setSelectedService(null);
      } else {
        // On mobile, snap to minimum 20% for the list drawer
        setActiveSnapPoint(0.2);
        setDrawerOpen(true);
      }
    } else {
      setDrawerOpen(open);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Request user location
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLocationPermission('denied');
      return;
    }

    // if (isLoading) return; // Prevent multiple calls - Removed to allow location request during initial load

    setIsLoading(true);

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationPermission('granted');

          // Check if user is in Israel (approximate boundaries)
          const isInIsrael = location.lat >= 29.5 && location.lat <= 33.3 &&
            location.lng >= 34.2 && location.lng <= 35.8;

          // Keep map focused on Israel, but show user location marker
          if (map) {
            const israelCenter = { lat: 31.7683, lng: 35.2137 };

            // Only center on user location if they're in Israel
            if (isInIsrael) {
              map.setCenter(location);
              map.setZoom(13);
            } else {
              // Keep Israel centered
              map.setCenter(israelCenter);
              map.setZoom(8);
            }

            // Add user location marker
            new window.google.maps.Marker({
              position: location,
              map: map,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
              },
              title: 'Your Location'
            });
          }

          // Calculate distances and sort services
          calculateDistancesAndSort(location);
          setIsLoading(false);
        },
        (error: GeolocationPositionError | null | undefined) => {
          setLocationPermission('denied');
          setIsLoading(false);

          // Handle cases where error might be null, undefined, or empty
          if (!error) {
            // Silent failure - no error object provided
            return;
          }

          // Check if error has a code property and is a valid GeolocationPositionError
          const errorCode = error?.code;

          // Skip logging if error is empty object or doesn't have a valid code
          // Also check if error object has any enumerable properties
          const hasErrorProperties = error && Object.keys(error).length > 0;
          if (errorCode === undefined || errorCode === null || !hasErrorProperties) {
            // Silent failure - empty or invalid error object
            return;
          }

          // Only log non-permission errors (user denial is expected)
          // Code 1 = PERMISSION_DENIED (silent - user choice)
          if (errorCode === 1) {
            // Silent - user denied permission
            return;
          }

          // Log only meaningful errors (codes 2 or 3)
          // GeolocationPositionError codes:
          // 1 = PERMISSION_DENIED (silent - user choice)
          // 2 = POSITION_UNAVAILABLE
          // 3 = TIMEOUT
          if (errorCode === 2) {
            const errorMessage = 'Location information is unavailable. Please check your device settings.';
            console.error('Error getting location: POSITION_UNAVAILABLE', {
              code: errorCode,
              message: error.message || errorMessage
            });
            toast.error(errorMessage);
          } else if (errorCode === 3) {
            const errorMessage = 'Location request timed out. Please try again.';
            console.error('Error getting location: TIMEOUT', {
              code: errorCode,
              message: error.message || errorMessage
            });
            toast.error(errorMessage);
          }
          // All other cases (including empty errors) are handled silently above
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Increased timeout to 10 seconds
          maximumAge: 60000 // Cache for 1 minute
        }
      );
    } catch (error) {
      console.error('Unexpected error in geolocation request:', error);
      setLocationPermission('denied');
      setIsLoading(false);
      toast.error('An unexpected error occurred while requesting location. Please try again.');
    }
  };

  // Geocode service address to get coordinates
  const geocodeService = async (service: Service): Promise<{ lat: number; lng: number } | null> => {
    if (!geocoderRef.current) return null;

    const address = service.address || service.location;
    if (!address) return null;

    return new Promise((resolve) => {
      geocoderRef.current.geocode({ address }, (results: any[], status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          resolve(null);
        }
      });
    });
  };

  // Calculate distances for all services and sort them
  const calculateDistancesAndSort = async (userLoc: { lat: number; lng: number }) => {
    setIsLoading(true);
    const servicesWithDistances: ServiceWithCoordinates[] = [];

    for (const service of services) {
      const coords = await geocodeService(service);
      if (coords) {
        const distance = calculateDistance(userLoc.lat, userLoc.lng, coords.lat, coords.lng);
        servicesWithDistances.push({
          ...service,
          coordinates: coords,
          distance
        });
      } else {
        // If geocoding fails, still include the service but without distance
        servicesWithDistances.push({
          ...service
        });
      }
    }

    // Sort by distance (closest first)
    servicesWithDistances.sort((a, b) => {
      if (!a.distance) return 1;
      if (!b.distance) return -1;
      return a.distance - b.distance;
    });

    setServicesWithCoords(servicesWithDistances);
    updateMapMarkers(servicesWithDistances);
    setIsLoading(false);
  };

  // Update map markers
  const updateMapMarkers = (servicesData: ServiceWithCoordinates[], targetMap?: any) => {
    const mapToUse = targetMap || map;
    if (!mapToUse || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: any[] = [];
    const newInfoWindows = new Map<string, any>();

    servicesData.forEach((service) => {
      if (!service.coordinates) return;

      const marker = new window.google.maps.Marker({
        position: service.coordinates,
        map: mapToUse,
        title: service.name,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
      });

      // Create info window content
      const infoContent = `
        <div style="padding: 10px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">${service.name}</h3>
          ${service.address ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${service.address}</p>` : ''}
          ${service.phone ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">📞 ${service.phone}</p>` : ''}
          ${service.distance ? `<p style="margin: 0; color: #4285F4; font-size: 12px; font-weight: bold;">📍 ${service.distance.toFixed(2)} km away</p>` : ''}
        </div>
      `;

      const infoWindowInstance = new window.google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        // Close previous info window
        if (currentInfoWindow) {
          currentInfoWindow.close();
        }
        // Set selected service and highlight it
        setSelectedService(service);
        if (service.id) {
          setHighlightedServiceIds([service.id]);
        }

        // Always show drawer at full height
        setDrawerOpen(true);
        setActiveSnapPoint(1);

        // Load comments when service is selected
        if (service.id) {
          loadComments(service.id);
        }
        // Check if favorited
        if (user && service.id) {
          checkIfFavorited(service.id);
        }
      });

      newMarkers.push(marker);
      if (service.id) {
        newInfoWindows.set(service.id, { marker, infoWindow: infoWindowInstance });
      }
    });

    setMarkers(newMarkers);
    setMarkerInfoWindows(newInfoWindows);

    // Focus map on Israel with markers
    const israelCenter = { lat: 31.7683, lng: 35.2137 }; // Center of Israel (Jerusalem area)

    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      if (userLocation) {
        bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
      }

      // Check if bounds are within Israel's approximate boundaries
      // Israel roughly: Lat 29.5-33.3, Lng 34.2-35.8
      const israelBounds = {
        north: 33.3,
        south: 29.5,
        east: 35.8,
        west: 34.2
      };

      const boundsNE = bounds.getNorthEast();
      const boundsSW = bounds.getSouthWest();

      // If bounds are within Israel or close, fit them with padding
      if (boundsSW.lat() >= israelBounds.south - 1 &&
        boundsNE.lat() <= israelBounds.north + 1 &&
        boundsSW.lng() >= israelBounds.west - 1 &&
        boundsNE.lng() <= israelBounds.east + 1) {
        mapToUse.fitBounds(bounds, { padding: 50 });
      } else {
        // If markers are outside Israel, center on Israel and show markers with wider zoom
        mapToUse.setCenter(israelCenter);
        mapToUse.setZoom(8);
      }
    } else if (!userLocation) {
      // If no markers and no user location, center on Israel
      mapToUse.setCenter(israelCenter);
      mapToUse.setZoom(8);
    } else if (userLocation) {
      // If user location exists but no markers, center on Israel (user location will be visible)
      mapToUse.setCenter(israelCenter);
      mapToUse.setZoom(8);
    }
  };

  // Load Google Maps script
  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set');
        toast.error('Google Maps API key is not configured');
        setIsLoading(false);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[data-services-map]') as HTMLScriptElement;
      if (existingScript) {
        if (window.google && window.google.maps) {
          initializeMap();
        } else {
          // Wait for script to load using polling instead of event listener
          const checkInterval = setInterval(() => {
            if (window.google && window.google.maps) {
              clearInterval(checkInterval);
              initializeMap();
            }
          }, 100);

          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
          }, 5000);
        }
        return;
      }

      script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initServicesMap`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-services-map', 'true');

      window.initServicesMap = initializeMap;
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      // Cleanup is handled by the script itself
      if (window.initServicesMap) {
        delete window.initServicesMap;
      }
    };
  }, []);

  const initializeMap = (force = false) => {
    if (!mapRef.current || !window.google) return;

    // If map already exists and is bound to the same container, skip unless forced
    if (map && !force && map.getDiv && map.getDiv() === mapRef.current) {
      return;
    }

    // Default center (Israel)
    const defaultCenter = { lat: 31.7683, lng: 35.2137 };

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 8,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    const geocoderInstance = new window.google.maps.Geocoder();
    geocoderRef.current = geocoderInstance;

    setMap(mapInstance);

    // Geocode all services and add markers
    geocodeAllServices(mapInstance);
  };

  // Automatically request location when map is ready
  useEffect(() => {
    if (map && !hasRequestedLocation) {
      setHasRequestedLocation(true);
      // Small delay to ensure map is fully initialized
      setTimeout(() => {
        requestUserLocation();
      }, 500);
    }
  }, [map, hasRequestedLocation]);

  // Update services when prop changes
  useEffect(() => {
    if (userLocation) {
      calculateDistancesAndSort(userLocation);
    } else {
      geocodeAllServices(map);
    }
  }, [services]);

  // Highlight services when initialHighlightedServiceId is provided and services are loaded
  useEffect(() => {
    if (initialHighlightedServiceId && servicesWithCoords.length > 0 && map) {
      const idsToHighlight = initialHighlightedServiceId.split(',');
      const servicesToHighlight = servicesWithCoords.filter(s => s.id && idsToHighlight.includes(s.id));

      if (servicesToHighlight.length > 0) {
        setHighlightedServiceIds(idsToHighlight);

        // If multiple services, fit bounds to show all of them
        if (servicesToHighlight.length > 1) {
          const bounds = new window.google.maps.LatLngBounds();
          servicesToHighlight.forEach(service => {
            if (service.coordinates) {
              bounds.extend(new window.google.maps.LatLng(service.coordinates.lat, service.coordinates.lng));
            }
          });
          map.fitBounds(bounds, { padding: 100 });
        } else {
          // Single service - center on it
          const service = servicesToHighlight[0];
          if (service.coordinates) {
            setSelectedService(service);
            map.setCenter(service.coordinates);
            map.setZoom(15);
          }
        }
      }
    }
  }, [initialHighlightedServiceId, servicesWithCoords, map]);

  // Geocode all services
  const geocodeAllServices = async (targetMap?: any) => {
    if (!geocoderRef.current) return;

    setIsLoading(true);
    const servicesData: ServiceWithCoordinates[] = [];

    // Use default location (Israel center) if user location is not available
    const defaultLocation = { lat: 31.7683, lng: 35.2137 };
    const locationToUse = userLocation || defaultLocation;

    for (const service of services) {
      const coords = await geocodeService(service);
      if (coords) {
        // Calculate distance even if user location is not available (use default location)
        const distance = calculateDistance(locationToUse.lat, locationToUse.lng, coords.lat, coords.lng);
        servicesData.push({
          ...service,
          coordinates: coords,
          distance
        });
      } else {
        // Include service even if geocoding fails
        servicesData.push({
          ...service
        });
      }
    }

    // Sort by distance if available
    servicesData.sort((a, b) => {
      if (!a.distance) return 1;
      if (!b.distance) return -1;
      return a.distance - b.distance;
    });

    setServicesWithCoords(servicesData);
    updateMapMarkers(servicesData, targetMap);
    setIsLoading(false);
  };

  // Reinitialize map when layout/container changes (e.g., mobile vs desktop refresh)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.google) return;
    if (!mapRef.current) return;

    const needsNewMap = !map || (map.getDiv && map.getDiv() !== mapRef.current);
    if (needsNewMap) {
      initializeMap(true);
    }
  }, [isMobile, map]);

  // Handle service click from list
  const handleServiceClick = (service: ServiceWithCoordinates) => {
    console.log('handleServiceClick called', { service: service.name, id: service.id });
    
    // Close previous info window if any
    if (currentInfoWindow) {
      currentInfoWindow.close();
    }
    
    // Center map on service if coordinates exist
    if (service.coordinates && map) {
      map.setCenter(service.coordinates);
      map.setZoom(15);
    }
    
    // Set selected service and highlight it (matching marker click behavior)
    setSelectedService(service);
    if (service.id) {
      setHighlightedServiceIds([service.id]);
    }

    // Always show drawer/sidebar - do this immediately
    console.log('Setting drawerOpen to true');
    setDrawerOpen(true);

    // Load comments when service is selected
    if (service.id) {
      loadComments(service.id);
    }
    // Check if favorited
    if (user && service.id) {
      checkIfFavorited(service.id);
    }
  };


  return (
    <div className="w-full h-full relative">
      {/* Desktop Side Panel */}
      <div className="hidden md:flex flex-col w-96 h-full bg-white shadow-lg z-20 absolute left-0 top-0 border-r border-gray-200">
        <div className="p-4 border-b border-gray-100 bg-white z-10">
          {headerContent}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {servicesWithCoords.map((service, index) => (
            <div
              key={service.id || index}
              className={cn(
                "bg-white rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md",
                highlightedServiceIds.includes(service.id || '') ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleServiceClick(service);
              }}
            >
              <div className="flex gap-3">
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm mb-1 truncate">{service.name}</h3>
                  {service.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {service.distance !== undefined ? (
                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <MapPin size={12} />
                        {service.distance.toFixed(1)} km
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400 font-medium">
                        <MapPin size={12} />
                        {t('map.distanceUnavailable') || 'Distance unavailable'}
                      </span>
                    )}
                    {service.tags && service.tags.length > 0 && (
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {translateTag(service.tags[0])}
                        {service.tags.length > 1 && ` +${service.tags.length - 1}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {servicesWithCoords.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <p>{t('map.noServices')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout: Map + Drawer for Services List */}
      {isMobile ? (
        <div className="relative h-full w-full">
          {/* Mobile Header */}
          <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4 shadow-sm z-30">
            {headerContent}
          </div>

          {/* Map Container - Mobile (Full Screen) */}
          <div className="absolute inset-0 bg-gray-100">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {t('map.loading') || 'Loading map...'}
                  </p>
                </div>
              </div>
            )}

            {/* Floating Controls */}
            {mapFloatingControls && (
              <div className="absolute top-20 left-4 z-10">
                {mapFloatingControls}
              </div>
            )}

            {/* Locate Me Button - Position adjusts based on drawer */}
            <button
              onClick={requestUserLocation}
              className="absolute bottom-32 right-4 z-10 bg-white p-3 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              title="Show my location"
              aria-label="Show my location"
            >
              <MapPin className={cn("w-6 h-6", locationPermission === 'granted' ? "text-blue-600" : "text-gray-600")} />
            </button>

            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Services List Drawer (Always persistent - starts at 40%, can expand to 100% on tap) */}
          <Drawer
            open={true}
            modal={false}
            snapPoints={[0.4, 1]}
            activeSnapPoint={listSnapPoint || 0.4}
            setActiveSnapPoint={(snap) => {
              // Update snap point when user interacts with drawer
              if (snap !== null) {
                setListSnapPoint(snap);
              }
            }}
            fadeFromIndex={0}
            shouldScaleBackground={false}
            dismissible={false}
            onOpenChange={() => {
              // Prevent closing - keep drawer always open
            }}
          >
            <DrawerContent className="h-[100vh]">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Services List</DrawerTitle>
              </DrawerHeader>
              {/* Search Bar Placeholder or Title */}
              <div 
                className="px-4 py-2 border-b cursor-pointer"
                onClick={() => {
                  // Toggle between 40% and 100% when header is tapped
                  if (listSnapPoint === 0.4) {
                    setListSnapPoint(1);
                  } else {
                    setListSnapPoint(0.4);
                  }
                }}
              >
                <p className="text-sm font-semibold text-gray-500 text-center">{services.length} {t('map.servicesFound')}</p>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50 p-4 service-cards-scroll">
                {!isLoading && servicesWithCoords.length > 0 ? (
                  <div className="space-y-4 pb-20">
                    {servicesWithCoords.map((service, index) => (
                      <div
                        key={service.id || index}
                        className={cn(
                          "bg-white rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md",
                          highlightedServiceIds.includes(service.id || '') ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleServiceClick(service);
                        }}
                      >
                        <div className="flex gap-3">
                          <div className="w-20 h-20 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                            <img
                              src={service.image}
                              alt={service.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm mb-1 truncate">{service.name}</h3>
                            {service.description && (
                              <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {service.distance !== undefined ? (
                                <span className="flex items-center gap-1 text-blue-600 font-medium">
                                  <MapPin size={12} />
                                  {service.distance.toFixed(1)} km
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-gray-400 font-medium">
                                  <MapPin size={12} />
                                  {t('map.distanceUnavailable') || 'Distance unavailable'}
                                </span>
                              )}
                              {service.tags && service.tags.length > 0 && (
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                  {translateTag(service.tags[0])}
                                  {service.tags.length > 1 && ` +${service.tags.length - 1}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {!isLoading && <p>{t('map.noServices')}</p>}
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      ) : (
        <>
          {/* Map Container - Desktop */}
          <div className="w-full h-full relative overflow-hidden bg-gray-100 transition-all duration-300 md:pl-96">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {t('map.loading') || 'Loading map...'}
                  </p>
                </div>
              </div>
            )}

            {/* Floating Controls */}
            {mapFloatingControls && (
              <div className="absolute top-4 left-4 z-10 md:left-[calc(24rem+1rem)] rtl:md:right-[calc(24rem+1rem)] rtl:md:left-auto rtl:left-auto rtl:right-4">
                {mapFloatingControls}
              </div>
            )}

            {/* Locate Me Button */}
            <button
              onClick={requestUserLocation}
              className="absolute bottom-6 right-4 z-10 bg-white p-3 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              title="Show my location"
              aria-label="Show my location"
            >
              <MapPin className={cn("w-6 h-6", locationPermission === 'granted' ? "text-blue-600" : "text-gray-600")} />
            </button>

            <div ref={mapRef} className="w-full h-full" />
          </div>
        </>
      )}

      {/* Service Details - Side Panel (Desktop) / Bottom Sheet (Mobile) */}
      {selectedService && (
        <>
          {!isMobile ? (
            /* Desktop Side Panel */
            <>
              {/* Overlay */}
              {drawerOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-[99]"
                  onClick={() => handleDrawerClose(false)}
                />
              )}
              <div
                className={cn(
                  "fixed top-0 bottom-0 right-0 w-[500px] max-w-[90vw] bg-white shadow-2xl z-[100] transition-transform duration-300 ease-in-out overflow-hidden flex flex-col",
                  drawerOpen ? "translate-x-0" : "translate-x-full"
                )}
              >
                {/* Header with Close Button */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                  <h2 className="text-2xl font-bold">{selectedService.name}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDrawerClose(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {selectedService.description && selectedService.description.trim() !== '' && (
                    <p className="text-base text-gray-600 mb-4">
                      {selectedService.description}
                    </p>
                  )}

                  {/* Tags */}
                  {selectedService.tags && selectedService.tags.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2">
                      {selectedService.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-primary rounded-full px-2 py-1 text-xs text-white w-fit"
                        >
                          {translateTag(tag)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Distance */}
                  {selectedService.distance && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 font-semibold">
                      <MapPin size={16} />
                      <span>{selectedService.distance.toFixed(2)} km away</span>
                    </div>
                  )}

                  {/* Service photo */}
                  <div className="mb-4 flex items-center justify-center bg-gray-100">
                    <img
                      src={selectedService.image}
                      alt={selectedService.name}
                      className="max-w-full max-h-[400px] object-contain"
                      style={{
                        display: 'block'
                      }}
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="mb-4 space-y-2">
                    <h4 className="font-semibold">פרטי התקשרות</h4>
                    {selectedService.phone && selectedService.phone.trim() !== '' && selectedService.phone !== 'undefined' && selectedService.phone !== 'null' && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-gray-500" />
                        <span>{selectedService.phone}</span>
                      </div>
                    )}
                    {(selectedService.address || selectedService.location) && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-gray-500" />
                        <span>{selectedService.address || selectedService.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Google Reviews */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">ביקורות Google</h3>
                      {user ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCommentForm(!showCommentForm)}
                        >
                          הוסף ביקורת
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.error('עליך להתחבר כדי לכתוב ביקורת')}
                        >
                          הוסף ביקורת
                        </Button>
                      )}
                    </div>

                    {/* Comment Form */}
                    {showCommentForm && (
                      <div className="mt-4 rounded-lg border p-4 bg-gray-50">
                        <h4 className="font-semibold mb-3">הוסף ביקורת חדשה</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>דירוג</Label>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={20}
                                  className={cn(
                                    'cursor-pointer transition-colors',
                                    star <= userRating
                                      ? 'fill-orange-400 text-orange-400'
                                      : 'text-gray-300 hover:text-orange-300'
                                  )}
                                  onClick={() => handleStarClick(star)}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="comment">תגובה (אופציונלי)</Label>
                            <Textarea
                              id="comment"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="שתף את החוויה שלך... (אופציונלי)"
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSubmitComment} size="sm" disabled={isSubmittingComment}>
                              <Send size={16} className="mr-2" />
                              {isSubmittingComment ? 'שולח...' : 'שלח'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCommentForm(false)}
                            >
                              ביטול
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {isLoadingComments ? (
                      <div className="mt-4 text-center py-4 text-gray-500">
                        <p>טוען ביקורות...</p>
                      </div>
                    ) : comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="mt-2 border-b border-gray-200 p-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{comment.userName}</span>
                            <span className="ml-2 flex items-center gap-1 text-sm text-gray-600">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={
                                    i < comment.rating
                                      ? 'fill-orange-400 text-orange-400'
                                      : 'fill-gray-400 text-gray-400'
                                  }
                                />
                              ))}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{comment.content}</p>
                          <span className="text-xs text-gray-400">
                            {comment.createdAt.toLocaleDateString('he-IL')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="mt-4 text-center py-4 text-gray-500">
                        <p>אין עדיין ביקורות עבור השירות הזה</p>
                        <p className="text-sm">היה הראשון לכתוב ביקורת!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 flex-shrink-0">
                  <div className="flex justify-around gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="transition-colors hover:text-orange-500 focus:text-orange-500 focus:outline-none"
                      onClick={() => {
                        if (selectedService.address || selectedService.location) {
                          const address = selectedService.address || selectedService.location;
                          const encodedAddress = encodeURIComponent(address);
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                        } else {
                          toast.error('כתובת לא זמינה');
                        }
                      }}
                      title={t('navigation') || 'Navigation'}
                    >
                      <MapPin size={20} />
                    </Button>
                    <Separator
                      orientation="vertical"
                      className="w-[1px] bg-gray-300"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="transition-colors hover:text-orange-500 focus:text-orange-500 focus:outline-none"
                      onClick={() => {
                        if (selectedService.phone && selectedService.phone.trim() !== '' && selectedService.phone !== 'undefined' && selectedService.phone !== 'null') {
                          window.open(`tel:${selectedService.phone}`, '_self');
                        } else {
                          toast.error('מספר טלפון לא זמין');
                        }
                      }}
                      title={t('call') || 'Call'}
                    >
                      <Phone size={20} />
                    </Button>
                    <Separator
                      orientation="vertical"
                      className="w-[1px] bg-gray-300"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'transition-colors focus:outline-none',
                        isFavorited
                          ? 'text-orange-500 hover:text-orange-600 focus:text-orange-600'
                          : 'hover:text-orange-500 focus:text-orange-500'
                      )}
                      onClick={handleToggleFavorite}
                      disabled={isTogglingFavorite}
                      title={isFavorited ? t('removeFromFavorites') : t('addToFavorites')}
                    >
                      {isTogglingFavorite ? (
                        <div className="animate-spin rounded-full border-2 border-current border-t-transparent h-5 w-5" />
                      ) : isFavorited ? (
                        <Heart size={20} className="fill-current" />
                      ) : (
                        <Heart size={20} />
                      )}
                    </Button>
                    <Separator
                      orientation="vertical"
                      className="w-[1px] bg-gray-300"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="transition-colors hover:text-orange-500 focus:text-orange-500 focus:outline-none"
                      onClick={() => {
                        if (selectedService.id) {
                          router.push(`/${locale}/coupons?businessId=${selectedService.id}`);
                        } else {
                          toast.error('Business ID not available');
                        }
                      }}
                      title={t('coupons') || 'Vouchers'}
                    >
                      <Ticket size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Mobile Fullscreen Modal */
            <Drawer
              open={drawerOpen}
              onOpenChange={(open) => {
                setDrawerOpen(open);
                if (!open) {
                  setSelectedService(null);
                }
              }}
              snapPoints={[0.2, 1]}
              activeSnapPoint={activeSnapPoint}
              setActiveSnapPoint={(snap) => {
                // Allow dragging down to close, but prevent expanding beyond 100%
                if (snap === null || (typeof snap === 'number' && snap < 0.2)) {
                  setActiveSnapPoint(0.2);
                } else if (typeof snap === 'number' && snap > 1) {
                  setActiveSnapPoint(1);
                } else {
                  setActiveSnapPoint(snap);
                }
              }}
              dismissible={true}
              modal={true} // Modal to focus comfortably
            >
              <DrawerContent className="h-screen mt-0 rounded-none">
                <DrawerHeader>
                  <div className="flex items-center justify-between">
                    <DrawerTitle className="text-xl font-bold">{selectedService.name}</DrawerTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDrawerOpen(false);
                        setSelectedService(null);
                      }}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto p-4 h-full">
                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {selectedService.description && selectedService.description.trim() !== '' && (
                      <p className="text-base text-gray-600 mb-4">
                        {selectedService.description}
                      </p>
                    )}

                    {/* Tags */}
                    {selectedService.tags && selectedService.tags.length > 0 && (
                      <div className="mb-4 flex flex-col gap-2">
                        {selectedService.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-primary rounded-full px-2 py-1 text-xs text-white w-fit"
                          >
                            {translateTag(tag)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Distance */}
                    {selectedService.distance && (
                      <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 font-semibold">
                        <MapPin size={16} />
                        <span>{selectedService.distance.toFixed(2)} km away</span>
                      </div>
                    )}

                    {/* Service photo */}
                    <div className="mb-4 flex items-center justify-center bg-gray-100">
                      <img
                        src={selectedService.image}
                        alt={selectedService.name}
                        className="max-w-full max-h-[400px] object-contain"
                        style={{
                          display: 'block'
                        }}
                      />
                    </div>

                    {/* Contact Information */}
                    <div className="mb-4 space-y-2">
                      <h4 className="font-semibold">פרטי התקשרות</h4>
                      {selectedService.phone && selectedService.phone.trim() !== '' && selectedService.phone !== 'undefined' && selectedService.phone !== 'null' && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={16} className="text-gray-500" />
                          <span>{selectedService.phone}</span>
                        </div>
                      )}
                      {(selectedService.address || selectedService.location) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-gray-500" />
                          <span>{selectedService.address || selectedService.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Google Reviews */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">ביקורות Google</h3>
                        {user ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCommentForm(!showCommentForm)}
                          >
                            הוסף ביקורת
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.error('עליך להתחבר כדי לכתוב ביקורת')}
                          >
                            הוסף ביקורת
                          </Button>
                        )}
                      </div>

                      {/* Comment Form */}
                      {showCommentForm && (
                        <div className="mt-4 rounded-lg border p-4 bg-gray-50">
                          <h4 className="font-semibold mb-3">הוסף ביקורת חדשה</h4>
                          <div className="space-y-3">
                            <div>
                              <Label>דירוג</Label>
                              <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={20}
                                    className={cn(
                                      'cursor-pointer transition-colors',
                                      star <= userRating
                                        ? 'fill-orange-400 text-orange-400'
                                        : 'text-gray-300 hover:text-orange-300'
                                    )}
                                    onClick={() => handleStarClick(star)}
                                  />
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="comment">תגובה (אופציונלי)</Label>
                              <Textarea
                                id="comment"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="שתף את החוויה שלך... (אופציונלי)"
                                rows={3}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSubmitComment} size="sm" disabled={isSubmittingComment}>
                                <Send size={16} className="mr-2" />
                                {isSubmittingComment ? 'שולח...' : 'שלח'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCommentForm(false)}
                              >
                                ביטול
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {isLoadingComments ? (
                        <div className="mt-4 text-center py-4 text-gray-500">
                          <p>טוען ביקורות...</p>
                        </div>
                      ) : comments.length > 0 ? (
                        comments.map((comment) => (
                          <div key={comment.id} className="mt-2 border-b border-gray-200 p-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{comment.userName}</span>
                              <span className="ml-2 flex items-center gap-1 text-sm text-gray-600">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={14}
                                    className={
                                      i < comment.rating
                                        ? 'fill-orange-400 text-orange-400'
                                        : 'fill-gray-400 text-gray-400'
                                    }
                                  />
                                ))}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{comment.content}</p>
                            <span className="text-xs text-gray-400">
                              {comment.createdAt.toLocaleDateString('he-IL')}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="mt-4 text-center py-4 text-gray-500">
                          <p>אין עדיין ביקורות עבור השירות הזה</p>
                          <p className="text-sm">היה הראשון לכתוב ביקורת!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
                    <div className="flex justify-around gap-4">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="transition-colors hover:text-orange-500 focus:text-orange-500 focus:outline-none"
                        onClick={() => {
                          if (selectedService.address || selectedService.location) {
                            const address = selectedService.address || selectedService.location;
                            const encodedAddress = encodeURIComponent(address);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                          } else {
                            toast.error('כתובת לא זמינה');
                          }
                        }}
                        title={t('navigation') || 'Navigation'}
                      >
                        <MapPin size={24} />
                      </Button>
                      <Separator
                        orientation="vertical"
                        className="w-[1px] bg-gray-300"
                      />
                      <Button
                        variant="ghost"
                        size="lg"
                        className="transition-colors hover:text-orange-500 focus:text-orange-500 focus:outline-none"
                        onClick={() => {
                          if (selectedService.phone && selectedService.phone.trim() !== '' && selectedService.phone !== 'undefined' && selectedService.phone !== 'null') {
                            window.open(`tel:${selectedService.phone}`, '_self');
                          } else {
                            toast.error('מספר טלפון לא זמין');
                          }
                        }}
                        title={t('call') || 'Call'}
                      >
                        <Phone size={24} />
                      </Button>
                      <Separator
                        orientation="vertical"
                        className="w-[1px] bg-gray-300"
                      />
                      <Button
                        variant="ghost"
                        size="lg"
                        className={cn(
                          'transition-colors focus:outline-none',
                          isFavorited
                            ? 'text-orange-500 hover:text-orange-600 focus:text-orange-600'
                            : 'hover:text-orange-500 focus:text-orange-500'
                        )}
                        onClick={handleToggleFavorite}
                        disabled={isTogglingFavorite}
                        title={isFavorited ? t('removeFromFavorites') : t('addToFavorites')}
                      >
                        {isTogglingFavorite ? (
                          <div className="animate-spin rounded-full border-2 border-current border-t-transparent h-6 w-6" />
                        ) : isFavorited ? (
                          <Heart size={24} className="fill-current" />
                        ) : (
                          <Heart size={24} />
                        )}
                      </Button>
                      <Separator
                        orientation="vertical"
                        className="w-[1px] bg-gray-300"
                      />
                      <Button
                        variant="ghost"
                        size="lg"
                        className="transition-colors hover:text-orange-500 focus:text-orange-500 focus:outline-none"
                        onClick={() => {
                          if (selectedService.id) {
                            router.push(`/${locale}/coupons?businessId=${selectedService.id}`);
                          } else {
                            toast.error('Business ID not available');
                          }
                        }}
                        title={t('coupons') || 'Vouchers'}
                      >
                        <Ticket size={24} />
                      </Button>
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </>
      )}
    </div>
  );
};

export default ServicesMapView;
