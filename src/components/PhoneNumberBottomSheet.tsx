'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { updateUserInFirestore } from '@/src/lib/firebase/users';

interface PhoneNumberBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneAdded?: (phone: string) => void;
}

const PhoneNumberBottomSheet: React.FC<PhoneNumberBottomSheetProps> = ({
  isOpen,
  onClose,
  onPhoneAdded
}) => {
  const t = useTranslations('pages.MyPetsPage');
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    
    if (!phoneNumber.trim()) {
      toast.error(t('phoneNumberBottomSheet.errors.phoneRequired'));
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      toast.error(t('phoneNumberBottomSheet.errors.phoneInvalid'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Save phone number to Firestore
      const result = await updateUserInFirestore(user.uid, {
        phone: phoneNumber.trim()
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save phone number');
      }
      
      // Call the callback if provided
      if (onPhoneAdded) {
        onPhoneAdded(phoneNumber.trim());
      }
      
      toast.success(t('phoneNumberBottomSheet.success'));
      setPhoneNumber('');
      onClose();
    } catch (error) {
      console.error('Error adding phone number:', error);
      toast.error(t('phoneNumberBottomSheet.errors.addFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPhoneNumber('');
      onClose();
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
            onClick={handleClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
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
                    <h2 className="text-xl font-bold text-gray-900">{t('addPhoneNumber')}</h2>
                    <p className="text-sm text-gray-600">{t('phoneNumberDescription')}</p>
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phoneNumberBottomSheet.form.phoneLabel')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('phoneNumberBottomSheet.form.phonePlaceholder')}
                    disabled={isSubmitting}
                    className="text-lg"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">
                    {t('phoneNumberBottomSheet.form.countryCodeNote')}
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !phoneNumber.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t('phoneNumberBottomSheet.buttons.adding')}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {t('phoneNumberBottomSheet.buttons.addPhone')}
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

export default PhoneNumberBottomSheet;
