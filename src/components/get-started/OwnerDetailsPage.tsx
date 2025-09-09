import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';
import he from 'react-phone-number-input/locale/he';
import { MapPin, Map } from 'lucide-react';
import GetStartedInput from './ui/GetStartedInput';
import { GetStartedPhoneInput } from './ui/GetStartedPhoneInput';
import PrivacyLockToggle from './ui/PrivacyLockToggle';
import AddressMapSelector from '@/components/AddressMapSelector';

const OwnerDetailsPage = () => {
  const {
    control,
    setValue,
    watch,
    formState: { errors } // Access validation errors
  } = useFormContext();
  const t = useTranslations('pages.OwnerDetailsPage');
  const locale = useLocale();
  const [showMap, setShowMap] = useState(false);
  
  // Watch the address field to get current value
  const currentAddress = watch('ownerHomeAddress');

  useEffect(() => {
    Object.values(errors).forEach((error) => {
      if (error?.message) {
        toast.error(error.message as string, { id: error.message as string });
      }
    });
  }, [errors]);

  const handleAddressSelect = (address: string, coordinates: { lat: number; lng: number }) => {
    setValue('ownerHomeAddress', address);
    setValue('ownerCoordinates', coordinates);
    setShowMap(false);
  };

  return (
    <div className="flex h-full grow flex-col">
      <GetStartedHeader title={t('title')} />

      {/* Form */}
      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="space-y-10 px-0 pt-8">
          {/* Owner Name - Always public */}
          <Controller
            name="ownerFullName"
            control={control}
            render={({ field }) => (
              <GetStartedInput
                label={t('form.FullName')}
                id="fullName"
                {...field}
                hasError={!!errors.ownerFullName}
                errorMessage={errors.ownerFullName?.message as string}
              />
            )}
          />

          {/* Phone Number - Can be private */}
          <div className="flex items-center gap-2">
            <div className="flex-grow">
              <Controller
                name="ownerPhoneNumber"
                control={control}
                render={({ field }) => {
                  console.log('Phone field value:', field.value);
                  return (
                    <GetStartedPhoneInput
                      label={t('form.PhoneNumber')}
                      id="phoneNumber"
                      {...field}
                      hasError={!!errors.ownerPhoneNumber}
                      labels={locale === 'he' ? he : undefined}
                      defaultCountry="IL"
                      international={true}
                    />
                  );
                }}
              />
            </div>
            <Controller
              name="isOwnerPhonePrivate"
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

          {/* Email - Can be private */}
          <div className="flex items-center gap-2">
            <div className="flex-grow">
              <Controller
                name="ownerEmailAddress"
                control={control}
                render={({ field }) => (
                  <GetStartedInput
                    label={t('form.EmailAddress')}
                    id="emailAddress"
                    {...field}
                    hasError={!!errors.ownerEmailAddress}
                  />
                )}
              />
            </div>
            <Controller
              name="isOwnerEmailPrivate"
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

          {/* Address - Can be private */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-grow overflow-auto">
                <Controller
                  name="ownerHomeAddress"
                  control={control}
                  render={({ field }) => (
                    <GetStartedInput
                      label={t('form.HomeAddress')}
                      id="homeAddress"
                      {...field}
                      hasError={!!errors.ownerHomeAddress}
                    />
                  )}
                />
              </div>
              <Controller
                name="isOwnerAddressPrivate"
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
            
            {/* Map Selector Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMap(true)}
              className="w-full flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              {t('form.selectOnMap')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map Selector Modal */}
      {showMap && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('form.selectAddressOnMap')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMap(false)}
              >
                ✕
              </Button>
            </div>
            <div className="h-[calc(100%-80px)]">
              <AddressMapSelector
                onAddressSelect={handleAddressSelect}
                initialAddress={currentAddress}
                onClose={() => setShowMap(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDetailsPage;
