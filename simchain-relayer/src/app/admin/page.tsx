"use client";

import React, { useEffect, useState } from 'react';

interface Wallet {
  address: string;
  alias: string;
  balance: number;
  simHash: string;
  owner: string;
  createdAt: string;
}

export default function AdminPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    programId: string;
    programExists: boolean;
  } | null>(null);

  useEffect(() => {
    checkConnection();
    fetchWallets();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus({
          connected: true,
          programId: data.data.programId,
          programExists: data.data.programExists
        });
      } else {
        setConnectionStatus({
          connected: false,
          programId: 'Unknown',
          programExists: false
        });
      }
    } catch {
      setConnectionStatus({
        connected: false,
        programId: 'Unknown',
        programExists: false
      });
    }
  };

  const fetchWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/wallets');
      const data = await response.json();
      
      if (data.success) {
        setWallets(data.wallets);
      } else {
        setError(data.error || 'Failed to fetch wallets');
      }
    } catch (err) {
      setError('Failed to fetch wallet data');
      console.error('Error fetching wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = wallets.filter(
    (w) =>
      w.address.toLowerCase().includes(search.toLowerCase()) ||
      w.alias.toLowerCase().includes(search.toLowerCase()) ||
      w.simHash.toLowerCase().includes(search.toLowerCase()) ||
      w.owner.toLowerCase().includes(search.toLowerCase())
  );

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">Loading wallet data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchWallets}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">SIMChain Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            {connectionStatus && (
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                connectionStatus.connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>
                  {connectionStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              Total Wallets: {wallets.length}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <input
              className="flex-1 border-2 border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:outline-none placeholder-gray-500"
              placeholder="Search by wallet address, alias, SIM hash, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={fetchWallets}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-4 px-6 text-left font-semibold">Wallet Address</th>
                <th className="py-4 px-6 text-left font-semibold">Owner</th>
                <th className="py-4 px-6 text-left font-semibold">Alias</th>
                <th className="py-4 px-6 text-left font-semibold">Balance (SOL)</th>
                <th className="py-4 px-6 text-left font-semibold">SIM Hash</th>
                <th className="py-4 px-6 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((w, index) => (
                <tr key={w.address} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-mono text-sm">{formatAddress(w.address)}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(w.address)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        title="Copy address"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-700 font-mono text-sm">{formatAddress(w.owner)}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(w.owner)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        title="Copy owner"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-700 font-medium">{w.alias || 'No alias'}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900 font-semibold">{w.balance.toFixed(4)} SOL</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-600 font-mono text-sm">{w.simHash}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button 
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        onClick={() => window.open(`https://explorer.solana.com/address/${w.address}?cluster=devnet`, '_blank')}
                      >
                        View
                      </button>
                      <button 
                        className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
                        onClick={() => navigator.clipboard.writeText(w.address)}
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No wallets found matching your search.
            </div>
          )}
        </div>

        {connectionStatus && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Connection Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Validator:</span>
                <span className={`ml-2 ${connectionStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {connectionStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Program ID:</span>
                <span className="ml-2 font-mono text-blue-600">{connectionStatus.programId}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Program Status:</span>
                <span className={`ml-2 ${connectionStatus.programExists ? 'text-green-600' : 'text-red-600'}`}>
                  {connectionStatus.programExists ? 'Deployed' : 'Not Found'}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Port:</span>
                <span className="ml-2 text-blue-600">8899 (Local)</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p>💡 <strong>Privacy Note:</strong> Phone numbers are not displayed for security reasons. Only wallet addresses, aliases, and owners are shown.</p>
        </div>
      </div>
    </div>
  );
}