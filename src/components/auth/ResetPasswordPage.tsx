'use client';

import BackButton from '@/components/get-started/ui/BackButton';
import GetStartedFloatingActionButton from '@/components/get-started/ui/GetStartedFloatingActionButton';
import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import GetStartedInput from '@/components/get-started/ui/GetStartedInput';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from '@/i18n/routing';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const t = useTranslations('pages.ResetPasswordPage');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [tokenValid, setTokenValid] = React.useState<boolean | null>(null);

  const token = searchParams.get('token');

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid reset link');
        setTokenValid(false);
        return;
      }

      try {
        const { validateResetToken } = await import(
          '@/src/lib/actions/password-reset'
        );
        const result = await validateResetToken(token);

        if (result.success) {
          setTokenValid(true);
        } else {
          setError(result.error || 'Invalid or expired reset link');
          setTokenValid(false);
        }
      } catch (error) {
        setError('An error occurred while validating the reset link');
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordSchema) => {
    if (!token) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const { resetPassword } = await import(
        '@/src/lib/actions/password-reset'
      );
      const result = await resetPassword(token, data.password);

      if (result.success) {
        toast.success('Password reset successfully!');
        router.push('/auth/sign-in');
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="flex h-full grow flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p>Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Show error state if token is invalid
  if (tokenValid === false) {
    return (
      <div className="flex h-full grow flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-4 text-red-500">
              <svg
                className="mx-auto h-16 w-16"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-bold">Invalid Reset Link</h1>
            <p className="mb-6 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/auth/forgot')}
              className="bg-primary hover:bg-primary/90 rounded-lg px-6 py-2 text-white"
            >
              Request New Reset Link
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full grow flex-col p-4">
      <BackButton handleBack={() => router.back()} />
      <GetStartedHeader title={t('title', { default: 'Reset Password' })} />

      <div className="flex flex-col items-center justify-center">
        <p className="max-w-80 text-center text-lg font-normal">
          {t('subtitle', { default: 'Enter your new password below' })}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex h-full flex-grow flex-col"
      >
        <Card className="flex flex-grow flex-col border-none bg-transparent shadow-none">
          <CardContent className="space-y-6 px-0 pt-8">
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <GetStartedInput
                  label={t('form.password', { default: 'New Password' })}
                  id="password"
                  type="password"
                  {...field}
                  hasError={!!errors.password}
                  errorMessage={errors.password?.message}
                  required
                />
              )}
            />

            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <GetStartedInput
                  label={t('form.confirmPassword', {
                    default: 'Confirm New Password'
                  })}
                  id="confirmPassword"
                  type="password"
                  {...field}
                  hasError={!!errors.confirmPassword}
                  errorMessage={errors.confirmPassword?.message}
                  required
                />
              )}
            />

            {error && (
              <div className="text-center text-sm text-red-500">{error}</div>
            )}
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

export default ResetPasswordPage;
