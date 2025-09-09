'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import LocaleSwitcher from '@/components/LocaleSwitcher';

interface EmailVerificationPageProps {
  email: string;
  password?: string;
  fullName?: string;
  address?: string;
  phone?: string;
  onBack?: () => void;
}

const EmailVerificationPage = ({ email, password, fullName, address, phone, onBack }: EmailVerificationPageProps) => {
  const t = useTranslations('pages.EmailVerification');
  const { user, verifyCodeAndCreateAccount, sendVerificationCode, getStoredOTPCode } = useAuth();
  const router = useRouter();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Debug: Log stored OTP code when component loads
  useEffect(() => {
    const storedCode = getStoredOTPCode();
    console.log('🔍 EmailVerificationPage loaded with stored code:', storedCode);
    if (storedCode) {
      console.log('🔑 DEBUG: Use this code for verification:', storedCode);
    }
  }, [getStoredOTPCode]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password && fullName) {
        // This is a signup flow - verify code and create account
        await verifyCodeAndCreateAccount(email, password, fullName, verificationCode, address, phone);
        toast.success('Account created successfully!');
        router.push('/pages/my-pets');
      } else {
        // This is just email verification (for existing users)
        const storedCode = getStoredOTPCode();
        console.log('🔍 Verifying code for existing user:', { 
          providedCode: verificationCode, 
          storedCode: storedCode,
          codesMatch: storedCode === verificationCode 
        });
        
        if (!storedCode || storedCode !== verificationCode) {
          toast.error('Invalid verification code');
          return;
        }

        toast.success('Email verified successfully!');
        router.push('/pages/my-pets');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setCountdown(60); // 60 second countdown

    try {
      // Use the AuthContext method which now uses the new system
      const result = await sendVerificationCode(email, fullName);
      
      if (result.success) {
        toast.success('Verification code sent!');
      } else {
        toast.error(result.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          {/* Language Switcher */}
          <div className="flex justify-end p-4">
            <LocaleSwitcher />
          </div>
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {t('title')}
            </CardTitle>
            <p className="text-gray-600">
              {t('subtitle')}
            </p>
            <p className="font-medium text-primary">{email}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t('verificationCode')}
                </label>
                <Input
                  type="text"
                  placeholder={t('verificationCodePlaceholder')}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="h-12 text-center text-lg tracking-widest"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('verifying')}</span>
                  </div>
                ) : (
                  t('verifyButton')
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {t('didntReceive')}
              </p>
              
              <Button
                onClick={handleResendCode}
                disabled={resendLoading || countdown > 0}
                variant="outline"
                className="w-full"
              >
                {resendLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('sending')}</span>
                  </div>
                ) : countdown > 0 ? (
                  `${t('resendIn')} ${countdown}s`
                ) : (
                  t('resendButton')
                )}
              </Button>

              {onBack && (
                <Button
                  onClick={onBack}
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('backToSignUp')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
