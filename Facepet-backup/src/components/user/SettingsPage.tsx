'use client';

import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import GetStartedInput from '@/components/get-started/ui/GetStartedInput';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from '@/src/i18n/routing';
import { updateProfile } from '@/src/lib/actions/user';
import {
  getUpdateProfileSchema,
  UpdateProfileSchema
} from '@/utils/validation/userSettings';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import he from 'react-phone-number-input/locale/he';
import { GetStartedPhoneInput } from '../get-started/ui/GetStartedPhoneInput';
import { ConfirmProfileChanges } from './ConfirmProfileChanges';

const SettingsPage = ({
  userDetails
}: {
  userDetails: { fullName: string; phone: string; email: string };
}) => {
  const t = useTranslations('pages.UserSettingsPage');
  const locale = useLocale();
  const updateProfileSchema = getUpdateProfileSchema(t);
  const [loading, setLoading] = React.useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const onError = (error: any) => {
    console.error(error);
    toast.error(error);
  };

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: userDetails.fullName,
      phoneNumber: userDetails.phone,
      emailAddress: userDetails.email,
      currentPassword: '',
      password: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    Object.values(errors).forEach((error) => {
      if (error?.message) {
        toast.error(error.message, { id: error.message });
      }
    });
  }, [errors]);

  const onSubmit = async (data: any) => {
    setLoading(true);

    // Check if password is being changed
    if (data.password && data.password.trim() !== '') {
      // Handle password change with email verification
      const { requestPasswordChange } = await import(
        '@/src/lib/actions/password-change'
      );
      const result = await requestPasswordChange(
        data.currentPassword || '',
        data.password
      );

      if (result.success) {
        toast.success(
          'Verification code sent to your email. Please check your inbox.'
        );
        // Redirect to password change confirmation page
        router.push('/auth/confirmation');
      } else {
        onError(result.error || 'Failed to request password change');
      }
    } else {
      // Handle regular profile update (without password change)
      const profileData = {
        fullName: data.fullName,
        phone: data.phoneNumber,
        email: data.emailAddress
      };

      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success('Profile updated successfully');
      } else {
        onError(result.error || 'Update failed');
      }
    }

    setLoading(false);
  };

  return (
    <>
      <GetStartedHeader title={t('title', { default: 'Settings' })} />

      {/* Settings Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex h-full flex-grow flex-col"
      >
        <Card className="flex flex-grow flex-col border-none bg-transparent shadow-none">
          <CardContent className="space-y-10 px-0 pt-8">
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <GetStartedInput
                  label={t('form.FullName', { default: 'Full Name' })}
                  id="fullName"
                  {...field}
                  hasError={!!errors.fullName}
                />
              )}
            />
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <GetStartedPhoneInput
                  label={t('form.PhoneNumber', { default: 'Phone Number' })}
                  id="phoneNumber"
                  {...field}
                  hasError={!!errors.phoneNumber}
                  labels={locale === 'he' ? he : undefined}
                  defaultCountry="IL"
                  international={false}
                />
              )}
            />
            <Controller
              name="emailAddress"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <GetStartedInput
                    label={t('form.EmailAddress', { default: 'Email Address' })}
                    id="emailAddress"
                    {...field}
                    hasError={!!errors.emailAddress}
                  />
                </div>
              )}
            />
            <Controller
              name="currentPassword"
              control={control}
              render={({ field }) => (
                <GetStartedInput
                  label={t('form.CurrentPassword', {
                    default: 'Current Password'
                  })}
                  id="currentPassword"
                  type="password"
                  {...field}
                  hasError={!!errors.currentPassword}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <GetStartedInput
                  label={t('form.NewPassword', { default: 'New Password' })}
                  id="password"
                  type="password"
                  {...field}
                  hasError={!!errors.password}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <GetStartedInput
                  label={t('form.ConfirmPassword', {
                    default: 'Confirm Password'
                  })}
                  id="confirmPassword"
                  type="password"
                  {...field}
                  hasError={!!errors.confirmPassword}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Confirm & Save Changes Button */}
        <div className="flex w-full flex-row-reverse items-center">
          <ConfirmProfileChanges
            onConfirm={handleSubmit(onSubmit)}
            loading={loading}
          />
        </div>
      </form>
    </>
  );
};

export default SettingsPage;
