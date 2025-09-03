'use client';

import { useState } from 'react';
import { runFirebaseDiagnostics, quickConnectivityTest } from '@/src/lib/firebase/diagnostics';

export default function DebugFirebasePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      console.log('Starting Firebase diagnostics...');
      const diagnosticResults = await runFirebaseDiagnostics();
      setResults(diagnosticResults);
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const testConnectivity = async () => {
    const isConnected = await quickConnectivityTest();
    alert(`Internet connectivity: ${isConnected ? 'OK' : 'FAILED'}`);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Firebase Diagnostics</h1>
      
      <div className="space-y-4">
        <button
          onClick={testConnectivity}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Internet Connectivity
        </button>
        
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Firebase Diagnostics'}
        </button>
      </div>

      {results && (
        <div className="mt-8 p-4 border rounded">
          <h2 className="text-xl font-bold mb-4">Diagnostic Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold text-yellow-800">Common Solutions:</h3>
        <ul className="list-disc list-inside text-yellow-700 mt-2">
          <li>Check your internet connection</li>
          <li>Verify Firebase project is active and not suspended</li>
          <li>Check if Firebase services are enabled in the console</li>
          <li>Verify API keys and project configuration</li>
          <li>Check browser console for additional error details</li>
          <li>Try clearing browser cache and cookies</li>
          <li>Test in incognito/private browsing mode</li>
        </ul>
      </div>
    </div>
  );
}