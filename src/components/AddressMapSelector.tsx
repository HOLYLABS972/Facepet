'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MapPin, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddressMapSelectorProps {
  onAddressSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  initialAddress?: string;
  initialCoordinates?: { lat: number; lng: number };
  onClose?: () => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const AddressMapSelector: React.FC<AddressMapSelectorProps> = ({
  onAddressSelect,
  initialAddress = '',
  initialCoordinates,
  onClose
}) => {
  const t = useTranslations('components.AddressMapSelector');
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [selectedCoordinates, setSelectedCoordinates] = useState(initialCoordinates || { lat: 31.7683, lng: 35.2137 }); // Default to Jerusalem
  const [geocoder, setGeocoder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    let isMounted = true;
    let checkInterval: NodeJS.Timeout | null = null;

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        if (isMounted) {
          initializeMap();
        }
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        if (window.google && window.google.maps) {
          if (isMounted) {
            initializeMap();
          }
        } else {
          checkInterval = setInterval(() => {
            if (window.google && window.google.maps && isMounted) {
              if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
              }
              initializeMap();
            }
          }, 100);
          
          setTimeout(() => {
            if (checkInterval) {
              clearInterval(checkInterval);
              checkInterval = null;
            }
          }, 5000);
        }
        return;
      }

      // Only create script if it doesn't exist and Google Maps isn't loaded
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAwzQsbG0vO0JWzOs7UAyu0upW6Xc1KL4E&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        
        window.initMap = initializeMap;
        document.head.appendChild(script);
      }
    };

    loadGoogleMaps();

    return () => {
      isMounted = false;
      
      // Clear any intervals
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      
      // Don't remove script - it might be used by other components
      // Only clean up the callback if it's ours
      if (window.initMap === initializeMap) {
        try {
          delete window.initMap;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: selectedCoordinates,
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    const geocoderInstance = new window.google.maps.Geocoder();
    setGeocoder(geocoderInstance);

    // Create initial marker
    const markerInstance = new window.google.maps.Marker({
      position: selectedCoordinates,
      map: mapInstance,
      draggable: true,
      title: t('markerTitle')
    });

    setMap(mapInstance);
    setMarker(markerInstance);

    // Add click listener to map
    mapInstance.addListener('click', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const newPosition = { lat, lng };
      
      markerInstance.setPosition(newPosition);
      setSelectedCoordinates(newPosition);
      
      // Reverse geocode to get address
      reverseGeocode(newPosition, geocoderInstance);
    });

    // Add drag listener to marker
    markerInstance.addListener('dragend', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const newPosition = { lat, lng };
      
      setSelectedCoordinates(newPosition);
      reverseGeocode(newPosition, geocoderInstance);
    });

    // If we have an initial address, geocode it
    if (initialAddress) {
      geocodeAddress(initialAddress, geocoderInstance, mapInstance, markerInstance);
    }
  };

  const reverseGeocode = (coordinates: { lat: number; lng: number }, geocoderInstance: any) => {
    geocoderInstance.geocode({ location: coordinates }, (results: any[], status: any) => {
      if (status === 'OK' && results[0]) {
        setSelectedAddress(results[0].formatted_address);
        setSearchQuery(results[0].formatted_address);
      }
    });
  };

  const geocodeAddress = (address: string, geocoderInstance: any, mapInstance: any, markerInstance: any) => {
    setIsLoading(true);
    geocoderInstance.geocode({ address }, (results: any[], status: any) => {
      setIsLoading(false);
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const coordinates = {
          lat: location.lat(),
          lng: location.lng()
        };
        
        mapInstance.setCenter(coordinates);
        markerInstance.setPosition(coordinates);
        setSelectedCoordinates(coordinates);
        setSelectedAddress(results[0].formatted_address);
        setSearchQuery(results[0].formatted_address);
      } else {
        toast.error(t('errors.geocodeFailed'));
      }
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || !geocoder || !map || !marker) return;
    geocodeAddress(searchQuery, geocoder, map, marker);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleConfirm = () => {
    if (selectedAddress && selectedCoordinates) {
      onAddressSelect(selectedAddress, selectedCoordinates);
      if (onClose) onClose();
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('searchPlaceholder')}
              className="ltr:pl-10 rtl:pr-10"
              disabled={isLoading}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isLoading || !searchQuery.trim()}
            variant="outline"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Instructions Overlay */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{t('instructions')}</span>
          </div>
        </div>
      </div>

      {/* Selected Address Display */}
      <div className="p-4 border-t bg-gray-50">
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 block mb-1">
            {t('selectedAddress')}
          </label>
          <div className="text-sm text-gray-600 bg-white p-2 rounded border">
            {selectedAddress || t('noAddressSelected')}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleConfirm}
            disabled={!selectedAddress}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Check className="w-4 h-4 mr-2" />
            {t('confirmAddress')}
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6"
            >
              {t('cancel')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressMapSelector;
