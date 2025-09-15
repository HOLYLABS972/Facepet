'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import GoogleSignupBottomSheet from '@/components/GoogleSignupBottomSheet';

interface ProfileCompletionGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

const ProfileCompletionGuard = ({ 
  children, 
  redirectTo = '/auth' 
}: ProfileCompletionGuardProps) => {
  const { user, loading, needsProfileCompletion, checkProfileCompletion } = useAuth();
  const router = useRouter();
  const t = useTranslations('pages.HomePage');

  useEffect(() => {
    if (!loading && user) {
      // Check if user has completed their profile
      checkProfileCompletion(user);
    }
  }, [user, loading, checkProfileCompletion]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    router.push(redirectTo);
    return null;
  }

  // Show profile completion bottom sheet if needed
  if (needsProfileCompletion) {
    return (
      <>
        <GoogleSignupBottomSheet
          isOpen={true}
          onClose={() => {}} // Prevent closing without completion
          onComplete={() => {}} // Will be handled by the sheet itself
        />
        {/* Show a message that profile completion is required */}
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Profile Completion Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please complete your profile by providing your phone number and address to access the dashboard.
            </p>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // User is authenticated and profile is complete
  return <>{children}</>;
};

export default ProfileCompletionGuard;
