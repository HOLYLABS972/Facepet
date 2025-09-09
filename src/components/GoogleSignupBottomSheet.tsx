'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MapPin, Check, Map } from 'lucide-react';
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
import AddressMapSelector from './AddressMapSelector';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User not authenticated');
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
      // Save phone number, address, and coordinates to Firestore
      const result = await updateUserInFirestore(user.uid, {
        phone: phoneNumber.trim(),
        address: address.trim(),
        coordinates: coordinates
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save information');
      }
      
      toast.success(t('success'));
      setPhoneNumber('');
      setAddress('');
      setCoordinates(null);
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

  const handleClose = () => {
    if (!isSubmitting) {
      setPhoneNumber('');
      setAddress('');
      setCoordinates(null);
      setShowMap(false);
      onClose();
    }
  };

  const handleAddressSelect = (selectedAddress: string, selectedCoordinates: { lat: number; lng: number }) => {
    setAddress(selectedAddress);
    setCoordinates(selectedCoordinates);
    setShowMap(false);
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
            onClick={handleClose}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
                    <p className="text-sm text-gray-600">{t('description')}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-8">
              <div className="space-y-6">
                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="rtl:text-right">{t('form.phoneLabel')}</Label>
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

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="rtl:text-right">{t('form.addressLabel')}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder={t('form.addressPlaceholder')}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={isSubmitting}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !phoneNumber.trim() || !address.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 rtl:flex-row-reverse"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
                        {t('buttons.saving')}
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
