"use client";

import { useState } from 'react';

export default function TestUSSDPage() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testHealthCheck = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health-check' })
      });
      const result = await response.json();
      addResult(`Health Check: ${result.success ? '✅ PASS' : '❌ FAIL'} - ${JSON.stringify(result)}`);
    } catch (error) {
      addResult(`Health Check: ❌ ERROR - ${error}`);
    }
    setIsLoading(false);
  };

  const testWalletExists = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'wallet-exists', 
          sim: '+1234567890' 
        })
      });
      const result = await response.json();
      addResult(`Wallet Exists: ${result.success ? '✅ PASS' : '❌ FAIL'} - ${JSON.stringify(result)}`);
    } catch (error) {
      addResult(`Wallet Exists: ❌ ERROR - ${error}`);
    }
    setIsLoading(false);
  };

  const testWalletInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'wallet-info', 
          sim: '+1234567890' 
        })
      });
      const result = await response.json();
      addResult(`Wallet Info: ${result.success ? '✅ PASS' : '❌ FAIL'} - ${JSON.stringify(result)}`);
    } catch (error) {
      addResult(`Wallet Info: ❌ ERROR - ${error}`);
    }
    setIsLoading(false);
  };

  const testWalletBalance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'wallet-balance', 
          sim: '+1234567890' 
        })
      });
      const result = await response.json();
      addResult(`Wallet Balance: ${result.success ? '✅ PASS' : '❌ FAIL'} - ${JSON.stringify(result)}`);
    } catch (error) {
      addResult(`Wallet Balance: ❌ ERROR - ${error}`);
    }
    setIsLoading(false);
  };

  const runAllTests = async () => {
    setResults([]);
    await testHealthCheck();
    await testWalletExists();
    await testWalletInfo();
    await testWalletBalance();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">🧪 USSD Relay API Test</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={testHealthCheck}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              Health Check
            </button>
            <button
              onClick={testWalletExists}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              Wallet Exists
            </button>
            <button
              onClick={testWalletInfo}
              disabled={isLoading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              Wallet Info
            </button>
            <button
              onClick={testWalletBalance}
              disabled={isLoading}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              Wallet Balance
            </button>
          </div>

          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="w-full bg-red-500 text-white py-3 px-4 rounded-md font-medium hover:bg-red-600 disabled:bg-gray-400 mb-6"
          >
            {isLoading ? '⏳ Running Tests...' : '🚀 Run All Tests'}
          </button>

          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Test Results:</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500">No tests run yet. Click a button above to start testing.</p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">📱 USSD Simulator Links:</h3>
            <div className="space-y-2">
              <a 
                href="/ussd" 
                className="block text-blue-600 hover:text-blue-800 underline"
              >
                🎮 USSD Simulator Interface
              </a>
              <a 
                href="/admin" 
                className="block text-blue-600 hover:text-blue-800 underline"
              >
                🔧 Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 