/**
 * Debug component to help troubleshoot OTP verification issues
 * This component shows the current state of OTP codes and allows testing
 */

import { useAuth } from '@/src/contexts/AuthContext';
import { useState } from 'react';

export default function OTPDebugger() {
  const { getStoredOTPCode, sendVerificationCode } = useAuth();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testUserName, setTestUserName] = useState('Test User');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTestCode = async () => {
    setIsLoading(true);
    try {
      const result = await sendVerificationCode(testEmail, testUserName);
      console.log('Test code sent:', result);
    } catch (error) {
      console.error('Test code error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const storedCode = getStoredOTPCode();

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 border rounded-lg shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🔍 OTP Debugger</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Stored Code:</strong> {storedCode || 'None'}
        </div>
        
        <div>
          <strong>Code Type:</strong> {typeof storedCode}
        </div>
        
        <div>
          <strong>Code Length:</strong> {storedCode?.length || 0}
        </div>
        
        <div className="pt-2 border-t">
          <input
            type="email"
            placeholder="Test email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full p-1 border rounded text-xs mb-1"
          />
          <input
            type="text"
            placeholder="Test user name"
            value={testUserName}
            onChange={(e) => setTestUserName(e.target.value)}
            className="w-full p-1 border rounded text-xs mb-2"
          />
          <button
            onClick={handleSendTestCode}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white p-1 rounded text-xs disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Test Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
