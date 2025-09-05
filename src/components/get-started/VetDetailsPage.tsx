import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useLocale, useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';
import he from 'react-phone-number-input/locale/he';
import GetStartedInput from './ui/GetStartedInput';
import { GetStartedPhoneInput } from './ui/GetStartedPhoneInput';
import PrivacyLockToggle from './ui/PrivacyLockToggle';
import VetSearchComponent from './ui/VetSearchComponent';
import { VetClinic } from '@/src/lib/firebase/vets';
import { useState } from 'react';

const VetDetailsPage = () => {
  const {
    control,
    setValue,
    formState: { errors }
  } = useFormContext();
  const t = useTranslations('pages.VetDetailsPage');
  const locale = useLocale();
  const [selectedVet, setSelectedVet] = useState<VetClinic | null>(null);

  const handleVetSelected = (vet: VetClinic) => {
    setSelectedVet(vet);
    // Pre-fill form with selected vet data
    setValue('vetId', vet.id);
    setValue('vetName', vet.name);
    setValue('vetPhoneNumber', vet.phoneNumber || '');
    setValue('vetEmailAddress', vet.email || '');
    setValue('vetAddress', vet.address || '');
  };

  const handleClearSelection = () => {
    setSelectedVet(null);
    // Clear form fields
    setValue('vetId', '');
    setValue('vetName', '');
    setValue('vetPhoneNumber', '');
    setValue('vetEmailAddress', '');
    setValue('vetAddress', '');
  };

  return (
    <div className="flex h-full grow flex-col">
      <GetStartedHeader title={t('title')} />

      {/* Form */}
      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="space-y-10 px-0 pt-8">
          {/* Vet Search Component */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t('searchLabel', { default: 'Search for existing veterinary clinic' })}
            </label>
            <VetSearchComponent
              onVetSelected={handleVetSelected}
              onClearSelection={handleClearSelection}
              selectedVet={selectedVet}
            />
            {selectedVet && (
              <p className="text-xs text-green-600">
                {t('vetSelected', { default: 'Veterinary clinic selected. Fields below are now read-only.' })}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {t('orLabel', { default: 'OR' })}
              </span>
            </div>
          </div>
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
                    disabled={!!selectedVet}
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
                  disabled={!!selectedVet}
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
                    disabled={!!selectedVet}
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
                  disabled={!!selectedVet}
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
                    disabled={!!selectedVet}
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
                  disabled={!!selectedVet}
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
                  <GetStartedInput
                    label={t('form.VeterinaryAddress')}
                    id="vetAddress"
                    {...field}
                    hasError={!!errors.vetAddress}
                    disabled={!!selectedVet}
                  />
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
                  disabled={!!selectedVet}
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
