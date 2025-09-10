'use client';

import GetStartedFloatingActionButton from '@/components/get-started/ui/GetStartedFloatingActionButton';
import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from '@/i18n/routing';
import {
  forgotPasswordSchema,
  ForgotPasswordSchema
} from '@/utils/validation/forgotPassword';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import BackButton from '../get-started/ui/BackButton';
import GetStartedInput from '../get-started/ui/GetStartedInput';

// Import the actual password reset function

const ForgotPasswordPage = () => {
  const t = useTranslations('pages.ForgotPasswordPage');
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: { email: '' }
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setLoading(true);
    setError(undefined);

    const { requestPasswordReset } = await import(
      '@/src/lib/actions/password-reset'
    );
    const result = await requestPasswordReset(data.email);

    if (result.success) {
      // Navigate to a page that instructs the user to check their email
      router.push('/auth/reset-password-sent');
    } else {
      setError(result.error || 'Failed to send reset email');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-full grow flex-col p-4">
      <BackButton handleBack={() => router.back()} />
      <GetStartedHeader title={t('title')} />
      {/* Subtitle */}
      <div className="flex flex-col items-center justify-center">
        <p className="max-w-80 text-center text-lg font-normal">
          {t('subtitle')}
        </p>
      </div>
      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-9 flex h-full grow flex-col"
      >
        <Card className="grow border-none bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-4 px-0">
            {/* Error Message with Shake Animation */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, x: 0 }}
                  animate={{
                    opacity: 1,
                    x: [0, -10, 10, -10, 10, 0]
                  }}
                  exit={{ opacity: 0, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <p className="text-sm text-red-500">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <GetStartedInput
                  label={t('form.email')}
                  id="email"
                  type="email"
                  {...field}
                  hasError={!!errors.email}
                  errorMessage={errors.email?.message as string}
                  required
                />
              )}
            />
          </CardContent>
        </Card>
        <div className="flex w-full flex-row items-center justify-end">
          <GetStartedFloatingActionButton
            isLastStep={true}
            isDisabled={!isValid}
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
