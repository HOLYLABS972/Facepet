'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Navigation, AlertCircle, Phone, Star, Send, Heart, HeartOff } from 'lucide-react';
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
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCommentsForAd, submitComment } from '@/lib/actions/admin';
import { addToFavorites, removeFromFavorites, isAdFavorited } from '@/lib/firebase/favorites';

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

const ServicesMapView: React.FC<ServicesMapViewProps> = ({ services }) => {
  const t = useTranslations('pages.ServicesPage');
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [servicesWithCoords, setServicesWithCoords] = useState<ServiceWithCoordinates[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [markers, setMarkers] = useState<any[]>([]);
  const [markerInfoWindows, setMarkerInfoWindows] = useState<Map<string, any>>(new Map());
  const [currentInfoWindow, setCurrentInfoWindow] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<ServiceWithCoordinates | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
  const geocoderRef = useRef<any>(null);
  const { user } = useAuth();

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

  // Handle drawer close
  const handleDrawerClose = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setSelectedService(null);
      setShowCommentForm(false);
      setUserRating(0);
      setCommentText('');
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

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setLocationPermission('granted');
        
        // Center map on user location
        if (map) {
          map.setCenter(location);
          map.setZoom(13);
          
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
      (error) => {
        console.error('Error getting location:', error);
        setLocationPermission('denied');
        setIsLoading(false);
        toast.error('Unable to get your location. Please enable location permissions.');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
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
  const updateMapMarkers = (servicesData: ServiceWithCoordinates[]) => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: any[] = [];
    const newInfoWindows = new Map<string, any>();

    servicesData.forEach((service) => {
      if (!service.coordinates) return;

      const marker = new window.google.maps.Marker({
        position: service.coordinates,
        map: map,
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
        // Set selected service and open drawer
        setSelectedService(service);
        setDrawerOpen(true);
        // Load comments when drawer opens
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

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      if (userLocation) {
        bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
      }
      map.fitBounds(bounds);
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
        if (window.google) {
          initializeMap();
        } else {
          existingScript.addEventListener('load', initializeMap);
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

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

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
    geocodeAllServices();
  };

  // Geocode all services
  const geocodeAllServices = async () => {
    if (!geocoderRef.current) return;

    setIsLoading(true);
    const servicesData: ServiceWithCoordinates[] = [];

    for (const service of services) {
      const coords = await geocodeService(service);
      if (coords) {
        servicesData.push({
          ...service,
          coordinates: coords
        });
      }
    }

    setServicesWithCoords(servicesData);
    updateMapMarkers(servicesData);
    setIsLoading(false);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Location Permission Button */}
      {locationPermission === 'prompt' && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('map.findNearby') || 'Find services near you'}
                </p>
                <p className="text-xs text-gray-600">
                  {t('map.locationPermission') || 'Allow location access to see closest services'}
                </p>
              </div>
            </div>
            <Button
              onClick={requestUserLocation}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  {t('map.useMyLocation') || 'Use My Location'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Location Denied Message */}
      {locationPermission === 'denied' && (
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-gray-700">
              {t('map.locationDenied') || 'Location access denied. Showing all services.'}
            </p>
          </div>
        </div>
      )}

      {/* Services List with Distances */}
      {locationPermission === 'granted' && servicesWithCoords.length > 0 && (
        <div className="mb-4 max-h-48 overflow-y-auto border rounded-lg p-2 bg-white">
          <p className="text-sm font-semibold mb-2 px-2">
            {t('map.closestServices') || 'Closest Services:'}
          </p>
          <div className="space-y-1">
            {servicesWithCoords.slice(0, 10).map((service, index) => {
              const markerData = service.id ? markerInfoWindows.get(service.id) : null;

              return (
                <div
                  key={service.id || index}
                  className="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                  onClick={() => {
                    if (service.coordinates && map) {
                      map.setCenter(service.coordinates);
                      map.setZoom(15);
                      // Open drawer with service details
                      setSelectedService(service);
                      setDrawerOpen(true);
                      if (service.id) {
                        loadComments(service.id);
                        if (user) {
                          checkIfFavorited(service.id);
                        }
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate flex-1">{service.name}</span>
                    {service.distance && (
                      <span className="text-blue-600 font-semibold ml-2">
                        {service.distance.toFixed(2)} km
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative border rounded-lg overflow-hidden">
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
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Service Details Drawer */}
      {selectedService && (
        <Drawer open={drawerOpen} onOpenChange={handleDrawerClose}>
          <DrawerContent className="flex max-h-[90dvh] flex-col sm:max-w-[425px]">
            {/* Scrollable content */}
            <div className="mx-4 mt-4 flex-1 overflow-x-hidden overflow-y-auto rounded-t-[10px]">
              <DrawerHeader className="ltr:text-left rtl:text-right">
                <DrawerTitle className="text-3xl">
                  {selectedService.name}
                </DrawerTitle>
                {selectedService.description && selectedService.description.trim() !== '' && (
                  <DrawerDescription className="text-base">
                    {selectedService.description}
                  </DrawerDescription>
                )}
                {/* Tags */}
                {selectedService.tags && selectedService.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedService.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-primary rounded-full px-2 py-1 text-xs text-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Distance */}
                {selectedService.distance && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 font-semibold">
                    <MapPin size={16} />
                    <span>{selectedService.distance.toFixed(2)} km away</span>
                  </div>
                )}
              </DrawerHeader>
              {/* Service photo */}
              <div className="mt-3">
                <img
                  src={selectedService.image}
                  alt={selectedService.name}
                  className="h-48 w-full rounded-md object-cover"
                />
              </div>
              
              {/* Contact Information */}
              <div className="mt-4 space-y-2">
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
              <div className="mt-5">
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
            
            {/* Sticky footer */}
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                delay: 0.2
              }}
              className="sticky bottom-0 z-20 rounded-t-[10px] bg-white shadow-md"
            >
              <DrawerFooter>
                <div className="flex justify-around">
                  <Button
                    variant="ghost"
                    className="focus:bg-primary flex items-center gap-2 transition-colors focus:text-white focus:outline-none"
                    onClick={() => {
                      if (selectedService.address || selectedService.location) {
                        const address = selectedService.address || selectedService.location;
                        const encodedAddress = encodeURIComponent(address);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                      } else {
                        toast.error('כתובת לא זמינה');
                      }
                    }}
                  >
                    <MapPin size={16} />
                    ניווט
                  </Button>
                  <Separator
                    orientation="vertical"
                    className="w-[1px] bg-gray-300"
                  />

                  <Button
                    variant="ghost"
                    className="focus:bg-primary flex items-center gap-2 transition-colors focus:text-white focus:outline-none"
                    onClick={() => {
                      if (selectedService.phone && selectedService.phone.trim() !== '' && selectedService.phone !== 'undefined' && selectedService.phone !== 'null') {
                        window.open(`tel:${selectedService.phone}`, '_self');
                      } else {
                        toast.error('מספר טלפון לא זמין');
                      }
                    }}
                  >
                    <Phone size={16} />
                    התקשר
                  </Button>
                  <Separator
                    orientation="vertical"
                    className="w-[1px] bg-gray-300"
                  />

                  <Button
                    variant="ghost"
                    className={cn(
                      'flex items-center gap-2 transition-colors focus:outline-none',
                      isFavorited 
                        ? 'text-red-500 hover:text-red-600 focus:text-red-600' 
                        : 'hover:text-red-500 focus:text-red-500'
                    )}
                    onClick={handleToggleFavorite}
                    disabled={isTogglingFavorite}
                  >
                    {isTogglingFavorite ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : isFavorited ? (
                      <Heart size={16} className="fill-current" />
                    ) : (
                      <HeartOff size={16} />
                    )}
                    {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                  </Button>
                </div>
              </DrawerFooter>
            </motion.div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default ServicesMapView;

