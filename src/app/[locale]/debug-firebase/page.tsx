'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { debugFirebaseStatus } from '@/src/lib/firebase/init-check';
import { testStorageConnection } from '@/src/lib/firebase/storage-init';
import { getStorageInstance } from '@/src/lib/firebase/storage-init';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function DebugFirebasePage() {
  const [status, setStatus] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const checkFirebase = () => {
    const result = debugFirebaseStatus();
    setStatus(result);
  };

  const testStorage = async () => {
    try {
      console.log('Testing Firebase Storage...');
      
      // First test storage connection
      const connectionTest = await testStorageConnection();
      if (!connectionTest.success) {
        setTestResult({ success: false, error: connectionTest.error });
        return;
      }
      
      // Get storage instance
      const storage = getStorageInstance();
      if (!storage) {
        setTestResult({ success: false, error: 'Storage instance not available' });
        return;
      }
      
      // Create a simple test file
      const testContent = 'Hello, Firebase Storage!';
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      
      // Create a reference to the test file
      const testRef = ref(storage, 'test/test-file.txt');
      
      console.log('Uploading test file...');
      
      // Upload the file
      const snapshot = await uploadBytes(testRef, testFile);
      console.log('File uploaded successfully:', snapshot.metadata.name);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', downloadURL);
      
      setTestResult({ success: true, downloadURL });
      
    } catch (error: any) {
      console.error('Storage test failed:', error);
      setTestResult({ success: false, error: error.message, code: error.code });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Firebase Debug Page</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Firebase Initialization Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={checkFirebase} className="mb-4">
              Check Firebase Status
            </Button>
            
            {status && (
              <div className="space-y-2">
                <p><strong>Success:</strong> {status.success ? '✅' : '❌'}</p>
                <p><strong>Storage:</strong> {status.storage ? '✅' : '❌'}</p>
                <p><strong>Auth:</strong> {status.auth ? '✅' : '❌'}</p>
                <p><strong>Firestore:</strong> {status.db ? '✅' : '❌'}</p>
                
                {status.issues.length > 0 && (
                  <div>
                    <p><strong>Issues:</strong></p>
                    <ul className="list-disc list-inside">
                      {status.issues.map((issue: string, index: number) => (
                        <li key={index} className="text-red-600">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Upload Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testStorage} className="mb-4">
              Test Storage Upload
            </Button>
            
            {testResult && (
              <div className="space-y-2">
                <p><strong>Result:</strong> {testResult.success ? '✅ Success' : '❌ Failed'}</p>
                
                {testResult.success && (
                  <div>
                    <p><strong>Download URL:</strong></p>
                    <p className="text-sm text-blue-600 break-all">{testResult.downloadURL}</p>
                  </div>
                )}
                
                {!testResult.success && (
                  <div>
                    <p><strong>Error:</strong> {testResult.error}</p>
                    {testResult.code && <p><strong>Code:</strong> {testResult.code}</p>}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
