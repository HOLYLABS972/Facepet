'use client';

import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

export default function AuthDebug() {
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    try {
      console.log('Debug: Logging out...', { session, status });
      
      await signOut({ 
        redirect: false,
        callbackUrl: '/auth/sign-in'
      });
      
      console.log('Debug: SignOut completed, redirecting...');
      window.location.href = '/auth/sign-in';
    } catch (error) {
      console.error('Debug: Logout error:', error);
      window.location.href = '/auth/sign-in';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
      <h3 className="font-bold text-sm mb-2">Auth Debug</h3>
      <div className="text-xs space-y-1">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Session:</strong> {session ? 'Yes' : 'No'}</p>
        {session && (
          <>
            <p><strong>User ID:</strong> {session.user?.id}</p>
            <p><strong>Name:</strong> {session.user?.name}</p>
            <p><strong>Email:</strong> {session.user?.email}</p>
          </>
        )}
      </div>
      {session && (
        <button
          onClick={handleLogout}
          className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Force Logout
        </button>
      )}
    </div>
  );
}
