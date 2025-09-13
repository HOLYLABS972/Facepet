import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';
import he from 'react-phone-number-input/locale/he';
import { MapPin } from 'lucide-react';
import GetStartedInput from './ui/GetStartedInput';
import { GetStartedPhoneInput } from './ui/GetStartedPhoneInput';
import PrivacyLockToggle from './ui/PrivacyLockToggle';
import LocationAutocompleteComboSelect from './ui/LocationAutocompleteSelector';

const OwnerDetailsPage = () => {
  const {
    control,
    setValue,
    watch,
    formState: { errors } // Access validation errors
  } = useFormContext();
  const t = useTranslations('pages.OwnerDetailsPage');
  const locale = useLocale();

  useEffect(() => {
    Object.values(errors).forEach((error) => {
      if (error?.message) {
        toast.error(error.message as string, { id: error.message as string });
      }
    });
  }, [errors]);


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
                    <LocationAutocompleteComboSelect
                      label={t('form.HomeAddress')}
                      id="homeAddress"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      hasError={!!errors.ownerHomeAddress}
                      required
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
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default OwnerDetailsPage;
