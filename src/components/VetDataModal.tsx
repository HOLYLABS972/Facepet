'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import GetStartedInput from './get-started/ui/GetStartedInput';
import { GetStartedPhoneInput } from './get-started/ui/GetStartedPhoneInput';
import PrivacyLockToggle from './get-started/ui/PrivacyLockToggle';
import { Plus, Edit, X } from 'lucide-react';
import he from 'react-phone-number-input/locale/he';

interface VetData {
  name?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  isNamePrivate?: boolean;
  isPhonePrivate?: boolean;
  isEmailPrivate?: boolean;
  isAddressPrivate?: boolean;
}

interface VetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vetData: VetData) => Promise<void>;
  initialData?: VetData | null;
  isEditing?: boolean;
}

export default function VetDataModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  isEditing = false 
}: VetDataModalProps) {
  const t = useTranslations('pages.PetProfilePage');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<VetData>({
    defaultValues: initialData || {
      name: '',
      phoneNumber: '',
      email: '',
      address: '',
      isNamePrivate: false,
      isPhonePrivate: false,
      isEmailPrivate: false,
      isAddressPrivate: false
    }
  });

  // Reset form when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: VetData) => {
    setIsLoading(true);
    try {
      await onSave(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error saving vet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Edit className="w-5 h-5 text-purple-500" />
                <span>{t('messages.editVetInfo')}</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-purple-500" />
                <span>{t('messages.addVetInfo')}</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-none bg-transparent shadow-none">
            <CardContent className="space-y-6 px-0">
              {/* Vet Name */}
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <GetStartedInput
                        label="Veterinary Name"
                        id="vetName"
                        {...field}
                        hasError={!!errors.name}
                        errorMessage={errors.name?.message}
                      />
                    )}
                  />
                </div>
                <Controller
                  name="isNamePrivate"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <PrivacyLockToggle
                      isPrivate={value}
                      onChange={onChange}
                      className="flex-shrink-0"
                    />
                  )}
                />
              </div>

              {/* Phone Number */}
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Controller
                    name="phoneNumber"
                    control={control}
                    render={({ field }) => (
                      <GetStartedPhoneInput
                        label="Phone Number"
                        id="phoneNumber"
                        {...field}
                        hasError={!!errors.phoneNumber}
                        labels={he}
                        defaultCountry="IL"
                        international={true}
                      />
                    )}
                  />
                </div>
                <Controller
                  name="isPhonePrivate"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <PrivacyLockToggle
                      isPrivate={value}
                      onChange={onChange}
                      className="flex-shrink-0"
                    />
                  )}
                />
              </div>

              {/* Email */}
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    }}
                    render={({ field }) => (
                      <GetStartedInput
                        label="Email Address"
                        id="emailAddress"
                        type="email"
                        {...field}
                        hasError={!!errors.email}
                        errorMessage={errors.email?.message}
                      />
                    )}
                  />
                </div>
                <Controller
                  name="isEmailPrivate"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <PrivacyLockToggle
                      isPrivate={value}
                      onChange={onChange}
                      className="flex-shrink-0"
                    />
                  )}
                />
              </div>

              {/* Address */}
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <GetStartedInput
                        label="Veterinary Address"
                        id="vetAddress"
                        {...field}
                        hasError={!!errors.address}
                        errorMessage={errors.address?.message}
                      />
                    )}
                  />
                </div>
                <Controller
                  name="isAddressPrivate"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <PrivacyLockToggle
                      isPrivate={value}
                      onChange={onChange}
                      className="flex-shrink-0"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Saving...' : (isEditing ? 'Update' : 'Add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
