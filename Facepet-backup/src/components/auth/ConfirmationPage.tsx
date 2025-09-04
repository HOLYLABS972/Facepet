'use client';

import GetStartedFloatingActionButton from '@/components/get-started/ui/GetStartedFloatingActionButton';
import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import GetStartedProgressDots from '@/components/get-started/ui/GetStartedProgressDots';
import { Card, CardContent } from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp';
import { redirect, useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { validateVerificationCode } from '@/src/lib/actions/verification';
import {
  ConfirmationSchema,
  confirmationSchema
} from '@/utils/validation/confirmation';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import BackButton from '../get-started/ui/BackButton';

interface ConfirmationPageProps {
  verificationType: 'email_verification' | 'password_reset' | 'email_change';
}

const ConfirmationPage = ({ verificationType }: ConfirmationPageProps) => {
  const t = useTranslations('pages.ConfirmationPage');
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const locale = useLocale();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ConfirmationSchema>({
    resolver: zodResolver(confirmationSchema),
    mode: 'onChange', // Trigger validation on change
    defaultValues: {
      otp: ''
    }
  });

  const onSubmit = async (data: ConfirmationSchema) => {
    setLoading(true);
    setError(undefined);

    const result = await validateVerificationCode(data.otp);
    if (result.success) {
      toast.success('Email verified successfully!');
      // Redirect to success page first, then to intended destination
      redirect({ href: '/', locale });
    } else {
      toast.error(result.error || 'Verification failed');
      setError(result.error || 'Verification failed');
    }
    setLoading(false);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError(undefined);

    try {
      // Import the appropriate resend function based on verification type
      let result;

      if (verificationType === 'password_reset') {
        // For password reset, we need to redirect back to settings to initiate a new request
        toast.error(
          'Please go back to settings to request a new password change'
        );
        setError('Please go back to settings to request a new password change');
        setResendLoading(false);
        return;
      } else if (verificationType === 'email_change') {
        // For email change, we need to redirect back to settings to initiate a new request
        toast.error('Please go back to settings to request a new email change');
        setError('Please go back to settings to request a new email change');
        setResendLoading(false);
        return;
      } else {
        // For email verification, we can resend
        const { resendVerificationCode } = await import(
          '@/src/lib/actions/verification'
        );
        result = await resendVerificationCode();
      }

      if (result?.success) {
        toast.success('Verification code sent successfully!');
        // Start cooldown timer (60 seconds)
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(result?.error || 'Failed to resend verification code');
        setError(result?.error || 'Failed to resend verification code');
      }
    } catch (error) {
      toast.error('Failed to resend verification code');
      setError('Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
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
        {session?.user?.email && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {session.user.email}
          </p>
        )}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-9 flex h-full grow flex-col"
      >
        <Card className="grow border-none bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-4 px-0">
            <Controller
              name="otp"
              control={control}
              render={({ field }) => (
                <InputOTP
                  {...field}
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  className="rtl:flex-row-reverse"
                >
                  <InputOTPGroup className="rtl:flex-row-reverse">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={cn(
                          'mx-0.5 h-12 w-10 rounded-md border border-gray-300 text-lg'
                        )}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              )}
            />

            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-gray-500">{t('form.resendText')}</span>
              <button
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || resendLoading}
                className={cn(
                  'font-bold underline',
                  resendCooldown > 0 || resendLoading
                    ? 'cursor-not-allowed text-gray-400'
                    : 'text-primary hover:text-primary/80'
                )}
              >
                {resendLoading
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : t('form.resendLink')}
              </button>
            </div>
          </CardContent>
        </Card>
        <div className="flex w-full flex-row items-center justify-between">
          <GetStartedProgressDots numberOfDots={2} currentDot={1} />
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

export default ConfirmationPage;
