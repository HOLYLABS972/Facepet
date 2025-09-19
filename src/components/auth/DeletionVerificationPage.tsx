'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import LocaleSwitcher from '@/components/LocaleSwitcher';

interface DeletionVerificationPageProps {
  email: string;
  userName?: string;
  onBack?: () => void;
  onVerified?: () => void;
}

const DeletionVerificationPage = ({ email, userName, onBack, onVerified }: DeletionVerificationPageProps) => {
  const t = useTranslations('pages.DeletionVerification');
  const { getStoredDeletionOTPCode, clearDeletionOTPCode } = useAuth();
  const router = useRouter();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);


  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const storedCode = getStoredDeletionOTPCode();
      
      if (!storedCode || storedCode !== verificationCode) {
        toast.error('Invalid verification code');
        return;
      }

      // Clear the stored code after successful verification
      clearDeletionOTPCode();
      
      toast.success('Account deletion verified successfully!');
      
      // Call the onVerified callback if provided
      if (onVerified) {
        onVerified();
      } else {
        // Default behavior - redirect to home page
        router.push('/');
      }
    } catch (error: any) {
      console.error('Deletion verification error:', error);
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/assets/Facepet-logo.png"
            alt="Facepet Logo"
            width={120}
            height={120}
            className="mx-auto mb-4"
          />
        </div>

        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LocaleSwitcher />
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">
              Account Deletion Verification
            </CardTitle>
            <p className="text-gray-600 mt-2">
              We've sent a verification code to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Please enter the code to confirm account deletion
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Delete Account'
                )}
              </Button>
            </form>


            {onBack && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeletionVerificationPage;
