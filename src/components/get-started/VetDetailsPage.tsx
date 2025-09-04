import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useLocale, useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';
import he from 'react-phone-number-input/locale/he';
import GetStartedInput from './ui/GetStartedInput';
import { GetStartedPhoneInput } from './ui/GetStartedPhoneInput';
import PrivacyLockToggle from './ui/PrivacyLockToggle';

const VetDetailsPage = () => {
  const {
    control,
    formState: { errors }
  } = useFormContext();
  const t = useTranslations('pages.VetDetailsPage');
  const locale = useLocale();

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
                    international={false}
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
                  <GetStartedInput
                    label={t('form.VeterinaryAddress')}
                    id="vetAddress"
                    {...field}
                    hasError={!!errors.vetAddress}
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
