'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import { useEffect } from 'react';

const SessionDebug = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('Firebase Auth Debug - Loading:', loading);
    console.log('Firebase Auth Debug - User:', user);
  }, [user, loading]);

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-[9999] max-w-sm">
      <h3 className="font-bold mb-2">Firebase Auth Debug</h3>
      <div className="text-sm space-y-1">
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>User Exists:</strong> {user ? 'Yes' : 'No'}</p>
        {user && (
          <>
            <p><strong>User ID:</strong> {user.uid || 'Empty'}</p>
            <p><strong>Name:</strong> {user.displayName || 'Empty'}</p>
            <p><strong>Email:</strong> {user.email || 'Empty'}</p>
            <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionDebug;
