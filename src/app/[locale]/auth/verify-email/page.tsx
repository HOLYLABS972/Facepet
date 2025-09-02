'use client';

import { useSearchParams } from 'next/navigation';
import EmailVerificationPage from '@/src/components/auth/EmailVerificationPage';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Request</h1>
          <p className="text-gray-600">No email provided for verification.</p>
        </div>
      </div>
    );
  }

  return <EmailVerificationPage email={email} />;
}
