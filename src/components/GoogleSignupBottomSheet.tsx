'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Check, Map, User } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { updateUserInFirestore } from '@/src/lib/firebase/users';
import { isValidPhoneNumber } from 'libphonenumber-js';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import LocationAutocompleteComboSelect from './get-started/ui/LocationAutocompleteSelector';
import { geocodeAddress } from '@/src/lib/geocoding/client';
import type { Coordinates } from '@/types/coordinates';

interface GoogleSignupBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const GoogleSignupBottomSheet: React.FC<GoogleSignupBottomSheetProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const t = useTranslations('pages.GoogleSignupBottomSheet');
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [placeId, setPlaceId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Fetch name from Google account when component mounts
  useEffect(() => {
    if (user?.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    
    if (!name.trim()) {
      toast.error(t('errors.nameRequired'));
      return;
    }
    
    if (!phoneNumber.trim()) {
      toast.error(t('errors.phoneRequired'));
      return;
    }

    if (!address.trim()) {
      toast.error(t('errors.addressRequired'));
      return;
    }

    // Validate phone number using libphonenumber-js
    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error(t('errors.phoneInvalid'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Geocode address if coordinates not already available
      let finalCoordinates = coordinates;
      let finalPlaceId = placeId;

      if (!finalCoordinates && address.trim()) {
        setIsGeocoding(true);
        try {
          const geocodeResult = await geocodeAddress(address.trim(), {
            validateIsraelBounds: true,
          });
          finalCoordinates = geocodeResult.coordinates;
          finalPlaceId = geocodeResult.placeId;
          setCoordinates(finalCoordinates);
          setPlaceId(finalPlaceId);
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          toast.error('Failed to geocode address. Please try a different address.');
          setIsSubmitting(false);
          setIsGeocoding(false);
          return;
        } finally {
          setIsGeocoding(false);
        }
      }

      // Save name, phone number, address, and coordinates to Firestore
      const result = await updateUserInFirestore(user.uid, {
        displayName: name.trim(),
        phone: phoneNumber.trim(),
        address: address.trim(),
        coordinates: finalCoordinates || undefined,
        placeId: finalPlaceId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save information');
      }

      toast.success(t('success'));
      setName('');
      setPhoneNumber('');
      setAddress('');
      setCoordinates(null);
      setPlaceId(undefined);
      onClose();

      // Call the completion callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error saving Google signup information:', error);
      toast.error(t('errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle address selection and geocode it immediately
   */
  const handleAddressChange = async (selectedAddress: string) => {
    setAddress(selectedAddress);

    // Geocode the address immediately when selected
    if (selectedAddress.trim()) {
      setIsGeocoding(true);
      try {
        const geocodeResult = await geocodeAddress(selectedAddress.trim(), {
          validateIsraelBounds: true,
        });
        setCoordinates(geocodeResult.coordinates);
        setPlaceId(geocodeResult.placeId);
      } catch (geocodeError) {
        console.error('Failed to geocode address:', geocodeError);
        // Don't show error toast here, user may still be typing
        setCoordinates(null);
        setPlaceId(undefined);
      } finally {
        setIsGeocoding(false);
      }
    } else {
      setCoordinates(null);
      setPlaceId(undefined);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
                  <p className="text-sm text-gray-600">{t('description')}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-8">
              <div className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="rtl:text-right">
                    {t('form.nameLabel')} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t('form.namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="rtl:text-right">
                    {t('form.addressLabel')} <span className="text-red-500">*</span>
                  </Label>
                  <LocationAutocompleteComboSelect
                    label=""
                    id="address"
                    value={address}
                    placeholder={t('form.addressPlaceholder')}
                    onChange={handleAddressChange}
                  />
                  {isGeocoding && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Validating address...
                    </p>
                  )}
                  {coordinates && !isGeocoding && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Address validated
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="rtl:text-right">
                    {t('form.phoneLabel')} <span className="text-red-500">*</span>
                  </Label>
                  <PhoneInput
                    id="phone"
                    value={phoneNumber}
                    onChange={(value) => setPhoneNumber(value || '')}
                    placeholder={t('form.phonePlaceholder')}
                    disabled={isSubmitting}
                    defaultCountry="IL"
                    className="phone-input"
                    international
                    countryCallingCodeEditable={false}
                    style={{
                      '--PhoneInput-color--focus': '#3b82f6',
                      '--PhoneInputCountrySelect-marginRight': '0.5rem',
                      '--PhoneInputCountrySelect-marginLeft': '0.5rem',
                      '--PhoneInputCountrySelectArrow-opacity': '1',
                      '--PhoneInputCountrySelectArrow-color': '#6b7280',
                    } as React.CSSProperties}
                  />
                  <p className="text-xs text-gray-500 mt-2 rtl:text-right">
                    {t('form.countryCodeNote')}
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isGeocoding || !name.trim() || !phoneNumber.trim() || !address.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 rtl:flex-row-reverse"
                  >
                    {isSubmitting || isGeocoding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
                        {isGeocoding ? 'Validating address...' : t('buttons.saving')}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        {t('buttons.save')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GoogleSignupBottomSheet;
