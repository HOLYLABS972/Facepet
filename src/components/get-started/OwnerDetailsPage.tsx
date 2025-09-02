import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';
import he from 'react-phone-number-input/locale/he';
import GetStartedInput from './ui/GetStartedInput';
import { GetStartedPhoneInput } from './ui/GetStartedPhoneInput';
import LocationAutocompleteSelector from './ui/LocationAutocompleteSelector';
import PrivacyLockToggle from './ui/PrivacyLockToggle';

const OwnerDetailsPage = () => {
  const {
    control,
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
                render={({ field }) => (
                  <GetStartedPhoneInput
                    label={t('form.PhoneNumber')}
                    id="phoneNumber"
                    {...field}
                    hasError={!!errors.ownerPhoneNumber}
                    labels={locale === 'he' ? he : undefined}
                    defaultCountry="IL"
                    international={false}
                  />
                )}
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
          <div className="flex items-center gap-2">
            <div className="flex-grow overflow-auto">
              <Controller
                name="ownerHomeAddress"
                control={control}
                render={({ field }) => (
                  <LocationAutocompleteSelector
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
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDetailsPage;
