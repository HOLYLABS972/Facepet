'use client';

import GetStartedFloatingActionButton from '@/components/get-started/ui/GetStartedFloatingActionButton';
import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import GetStartedInput from '@/components/get-started/ui/GetStartedInput';
import GetStartedProgressDots from '@/components/get-started/ui/GetStartedProgressDots';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from '@/i18n/routing';
import { signUp } from '@/src/lib/actions/auth';
import { SignUpSchema, getSignUpSchema } from '@/utils/validation/signUp';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import he from 'react-phone-number-input/locale/he';
import BackButton from '../get-started/ui/BackButton';
import { GetStartedPhoneInput } from '../get-started/ui/GetStartedPhoneInput';

const SignUpPage = () => {
  const t = useTranslations('pages.SignUpPage');
  const locale = useLocale();
  const router = useRouter();
  const signUpSchema = getSignUpSchema(t);

  const [loading, setLoading] = React.useState(false);

  const onError = (error: any) => {
    console.log(error);

    toast.error(error);
  };

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      emailAddress: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false
    }
  });

  useEffect(() => {
    Object.values(errors).forEach((error) => {
      if (error?.message) {
        toast.error(error.message, { id: error.message });
      }
    });
  }, [errors]);

  const onSubmit = async (data: SignUpSchema) => {
    setLoading(true);
    const authCredentials = {
      email: data.emailAddress,
      phone: data.phoneNumber,
      password: data.password,
      fullName: data.fullName
    };

    // Sign up the user (this now also generates the verification code)
    const result = await signUp(authCredentials);
    if (result.success) {
      // Redirect to the confirmation page with the email in the query string.
      router.push(`/auth/confirmation`);
      toast.success('Signed up successfully');
    } else {
      onError(result.error || 'Verification failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-full grow flex-col p-4">
      <BackButton handleBack={() => router.back()} />
      <GetStartedHeader title={t('title')} />

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex h-full grow flex-col"
      >
        <Card className="flex grow flex-col border-none bg-transparent shadow-none">
          <CardContent className="space-y-10 px-0 pt-8">
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <GetStartedInput
                  label={t('form.FullName')}
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
                  label={t('form.PhoneNumber')}
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
                <GetStartedInput
                  label={t('form.EmailAddress')}
                  id="emailAddress"
                  {...field}
                  hasError={!!errors.emailAddress}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <GetStartedInput
                  label={t('form.Password')}
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
                  label={t('form.ConfirmPassword')}
                  id="confirmPassword"
                  type="password"
                  {...field}
                  hasError={!!errors.confirmPassword}
                />
              )}
            />
          </CardContent>
          {/* Terms and Conditions Checkbox */}
          <div className="flex items-center">
            <Controller
              name="termsAccepted"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="termsAccepted"
                  {...field}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className={`data-[state=checked]:bg-primary border-gray-300 bg-white ${
                    errors.termsAccepted ? 'border-red-800' : ''
                  }`}
                  value={undefined}
                />
              )}
            />
            <label
              htmlFor="termsAccepted"
              className={`px-2 text-sm text-gray-700 ${
                errors.termsAccepted ? 'text-red-800' : ''
              }`}
            >
              {t('form.TermsAcceptPrefix')}{' '}
              <Link
                href="/terms"
                className={`text-primary underline ${
                  errors.termsAccepted ? 'text-red-800' : ''
                }`}
              >
                {t('form.TermsLink')}
              </Link>
            </label>
          </div>
        </Card>

        {/* Progress Dots and Floating Action Button */}
        <div className="flex w-full flex-row items-center justify-between">
          <GetStartedProgressDots numberOfDots={2} currentDot={0} />
          <GetStartedFloatingActionButton
            isLastStep={false}
            isDisabled={false}
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default SignUpPage;
