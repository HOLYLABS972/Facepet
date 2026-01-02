import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useLocale, useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';
import he from 'react-phone-number-input/locale/he';
import GetStartedInput from './ui/GetStartedInput';
import { GetStartedPhoneInput } from './ui/GetStartedPhoneInput';
import PrivacyLockToggle from './ui/PrivacyLockToggle';
import LocationAutocompleteComboSelect from './ui/LocationAutocompleteSelector';
import { geocodeAddress } from '@/src/lib/geocoding/client';
import { useState } from 'react';

const VetDetailsPage = () => {
  const {
    control,
    formState: { errors },
    setValue
  } = useFormContext();
  const t = useTranslations('pages.VetDetailsPage');
  const locale = useLocale();
  const [isGeocodingVet, setIsGeocodingVet] = useState(false);

  /**
   * Handle vet address selection and geocode it immediately
   */
  const handleVetAddressChange = async (selectedAddress: string) => {
    // Update the address field
    setValue('vetAddress', selectedAddress);

    // Geocode the address if it's not empty
    if (selectedAddress.trim()) {
      setIsGeocodingVet(true);
      try {
        const geocodeResult = await geocodeAddress(selectedAddress.trim(), {
          validateIsraelBounds: true,
        });
        setValue('vetCoordinates', geocodeResult.coordinates);
        setValue('vetPlaceId', geocodeResult.placeId);
      } catch (geocodeError) {
        console.error('Failed to geocode vet address:', geocodeError);
        // Clear coordinates if geocoding fails
        setValue('vetCoordinates', undefined);
        setValue('vetPlaceId', undefined);
      } finally {
        setIsGeocodingVet(false);
      }
    } else {
      setValue('vetCoordinates', undefined);
      setValue('vetPlaceId', undefined);
    }
  };

  return (
    <div className="flex h-full grow flex-col">
      <GetStartedHeader title={t('title')} />

      {/* Form */}
      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="space-y-10 px-0 pt-8">
          {/* Vet Name - Can be private */}
          <div className="flex items-center gap-2">
            <div className="flex-grow">
              <Controller
                name="vetName"
                control={control}
                render={({ field }) => (
                  <GetStartedInput
                    label={t('form.VeterinaryName')}
                    id="vetName"
                    {...field}
                    hasError={!!errors.vetName}
                    errorMessage={errors.vetName?.message as string}
                  />
                )}
              />
            </div>
            <Controller
              name="isVetNamePrivate"
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

          {/* Phone Number - Can be private */}
          <div className="flex items-center gap-2">
            <div className="flex-grow">
              <Controller
                name="vetPhoneNumber"
                control={control}
                render={({ field }) => (
                  <GetStartedPhoneInput
                    label={t('form.PhoneNumber')}
                    id="phoneNumber"
                    {...field}
                    hasError={!!errors.vetPhoneNumber}
                    labels={locale === 'he' ? he : undefined}
                    defaultCountry="IL"
                    international={true}
                  />
                )}
              />
            </div>
            <Controller
              name="isVetPhonePrivate"
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
                name="vetEmailAddress"
                control={control}
                render={({ field }) => (
                  <GetStartedInput
                    label={t('form.EmailAddress')}
                    id="emailAddress"
                    hasError={!!errors.vetEmailAddress}
                    errorMessage={errors.vetEmailAddress?.message as string}
                    {...field}
                  />
                )}
              />
            </div>
            <Controller
              name="isVetEmailPrivate"
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
          <div className="flex items-center gap-2">
            <div className="flex-grow overflow-auto">
              <Controller
                name="vetAddress"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <LocationAutocompleteComboSelect
                      label={t('form.VeterinaryAddress')}
                      id="vetAddress"
                      value={field.value || ''}
                      onChange={handleVetAddressChange}
                      onBlur={field.onBlur}
                      hasError={!!errors.vetAddress}
                      required
                    />
                    {isGeocodingVet && (
                      <p className="text-xs text-blue-600 flex items-center gap-1 px-3">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Validating address...
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
            <Controller
              name="isVetAddressPrivate"
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
    </div>
  );
};

export default VetDetailsPage;
