import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <h1 className="text-4xl font-bold mb-6">SIMChain Relayer</h1>
      <p className="text-lg text-gray-700 text-center max-w-xl">
        USSD-first multichain wallet solution with Solana, Polkadot, and Hyperbridge integration.
      </p>
      <br />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 full max-w-2xl">
        <a href="/ussd" className="block bg-white rounded-lg shadow p-6 shadow-lg transition cursor-pointer">
          <div className="text-2xl">📱 USSD Interface</div>
          <div className="text-gray-600 text-sm">USSD wallet operations</div>
        </a>
        <a href="/test-ussd" className="block bg-white rounded-lg shadow p-6 shadow-lg transition cursor-pointer">
          <div className="text-2xl mb-2">🧪 Test USSD</div>
          <div className="text-gray-600 text-sm">Test USSD API endpoints</div>
        </a>
        <a href="/hyperbridge-demo" className="block bg-white rounded-lg shadow p-6 shadow-lg transition cursor-pointer">
          <div className="text-2xl">Hyperbridge Demo</div>
          <div className="text-gray-600 text-sm">Test cross-chain features</div>
        </a>
        <a href="/admin" className="block bg-white rounded-lg shadow p-6 shadow-lg transition cursor-pointer">
          <div className="text-2xl">⚙️ Admin Dashboard</div>
          <div className="text-gray-600 text-sm">Wallet data and system status</div>
        </a>
      </div>
    </main>
  );
} 