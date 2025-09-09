'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import GoogleSignupBottomSheet from './GoogleSignupBottomSheet';

const GoogleSignupHandler = () => {
  const { needsGoogleProfileCompletion, completeGoogleProfile } = useAuth();

  return (
    <GoogleSignupBottomSheet
      isOpen={needsGoogleProfileCompletion}
      onClose={completeGoogleProfile}
      onComplete={completeGoogleProfile}
    />
  );
};

export default GoogleSignupHandler;
