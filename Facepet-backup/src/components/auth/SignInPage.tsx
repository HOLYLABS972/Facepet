'use client';

import GetStartedFloatingActionButton from '@/components/get-started/ui/GetStartedFloatingActionButton';
import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import GetStartedInput from '@/components/get-started/ui/GetStartedInput';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from '@/i18n/routing';
import { usePetId } from '@/src/hooks/use-pet-id';
import { signInWithCredentials } from '@/src/lib/actions/auth';
import { SignInSchema, signInSchema } from '@/utils/validation/signIn';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import BackButton from '../get-started/ui/BackButton';

const SignInPage = () => {
  const t = useTranslations('pages.SignInPage');
  const router = useRouter();
  const { petId } = usePetId();
  const [loading, setLoading] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      emailAddress: '',
      password: ''
    }
  });

  useEffect(() => {
    Object.values(errors).forEach((error) => {
      if (error?.message) {
        toast.error(error.message, { id: error.message });
      }
    });
  }, [errors]);

  const onSubmit = async (data: SignInSchema) => {
    setLoading(true);
    try {
      const authCredentials = {
        email: data.emailAddress,
        password: data.password
      };

      const result = await signInWithCredentials(authCredentials);
      if (result.success) {
        toast.success('Signed in successfully');
        if (petId != null) {
          router.push(`/pet/${petId}/get-started/register`);
        } else {
          router.push('/pages/my-pets');
        }
      } else {
        toast.error(result.error || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
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
        <Card className="grow border-none bg-transparent shadow-none">
          <CardContent className="space-y-10 px-0 pt-8">
            <Controller
              name="emailAddress"
              control={control}
              render={({ field }) => (
                <GetStartedInput
                  label={t('form.EmailAddress')}
                  id="emailAddress"
                  {...field}
                  hasError={!!errors.emailAddress}
                  required
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
                  required
                />
              )}
            />
          </CardContent>
        </Card>
        <div className="flex w-full flex-row items-center justify-between">
          <span
            className="text-gray-500 hover:underline"
            onClick={() => router.push('/auth/forgot')}
          >
            {t('forgotPassword')}
          </span>
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

export default SignInPage;
