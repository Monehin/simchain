'use client';

import { useState } from 'react';

interface StorageQueryResult {
  chain: string;
  key: string;
  value: unknown;
  blockNumber: number;
  timestamp: number;
}

interface PriceOracleResult {
  id: string;
  sourceDEX: string;
  targetChains: string[];
  updateInterval: number;
  tokenPair: string;
  price: number;
  lastUpdate: number;
  isActive: boolean;
}

interface IdentityResult {
  address: string;
  chains: Record<string, unknown>;
  aggregatedData: Record<string, unknown>;
}

interface TransferResult {
  sourceTx: string;
  targetTx: string;
  messageId: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export default function HyperbridgeDemo() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    storage?: StorageQueryResult;
    oracle?: PriceOracleResult;
    identity?: IdentityResult;
    transfer?: TransferResult;
  }>({});

  // Storage Query Form
  const [storageForm, setStorageForm] = useState({
    sourceChain: 'ethereum',
    targetChain: 'polkadot',
    storageKey: '0x123456789123456789012345678901234567890:0x0',
  });

  // Price Oracle Form
  const [oracleForm, setOracleForm] = useState({
    sourceDEX: 'uniswap_v3',
    targetChains: ['polkadot', 'solana'],
    updateInterval: 60,
    tokenPair: 'ETH/USDC',
  });

  // Identity Aggregation Form
  const [identityForm, setIdentityForm] = useState({
    userAddress: '042d35Cc6634C0532925a3b8D4db96C4b4d8b6',
    chains: ['ethereum', 'polkadot', 'solana'],
    identityData: ['balance', 'reputation'],
    includeBalances: true,
    includeTransactions: true,
  });

  // Cross-Chain Transfer Form
  const [transferForm, setTransferForm] = useState({
    fromChain: 'ethereum',
    toChain: 'polkadot',
    fromAddress: '042d35Cc6634C0532925a3b8D4db96b6',
    toAddress: '5GrwvaEF5Xb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    amount: '1',
    token: 'ETH',
  });

  const handleStorageQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hyperbridge/cross-chain-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storageForm),
      });
      const data = await response.json();
      if (data.success) {
        setResults(prev => ({ ...prev, storage: data.data }));
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOracle = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hyperbridge/price-oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oracleForm),
      });
      const data = await response.json();
      if (data.success) {
        setResults(prev => ({ ...prev, oracle: data.data }));
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAggregateIdentity = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hyperbridge/identity-aggregation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identityForm),
      });
      const data = await response.json();
      if (data.success) {
        setResults(prev => ({ ...prev, identity: data.data }));
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCrossChainTransfer = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hyperbridge/cross-chain-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm),
      });
      const data = await response.json();
      if (data.success) {
        setResults(prev => ({ ...prev, transfer: data.data }));
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🌉 Hyperbridge Integration Demo</h1>
          <p className="text-lg text-gray-600">
            Test cross-chain storage queries, price oracles, identity aggregation, and transfers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cross-Chain Storage Query */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Cross-Chain Storage Query</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Chain
                </label>
                <select
                  value={storageForm.sourceChain}
                  onChange={(e) => setStorageForm(prev => ({ ...prev, sourceChain: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="polkadot">Polkadot</option>
                  <option value="solana">Solana</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="base">Base</option>
                  <option value="optimism">Optimism</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Chain
                </label>
                <select
                  value={storageForm.targetChain}
                  onChange={(e) => setStorageForm(prev => ({ ...prev, targetChain: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="polkadot">Polkadot</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="solana">Solana</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="base">Base</option>
                  <option value="optimism">Optimism</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Key (format: contract:slot or pallet.item:address)
                </label>
                <input
                  type="text"
                  value={storageForm.storageKey}
                  onChange={(e) => setStorageForm(prev => ({ ...prev, storageKey: e.target.value }))}
                  placeholder="0x1234...:0x0lances.freeBalance:address"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                onClick={handleStorageQuery}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Querying...' : 'Query Storage'}
              </button>
            </div>
            {results.storage && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.storage, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Price Oracle */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">💰 Price Oracle</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source DEX
                </label>
                <input
                  type="text"
                  value={oracleForm.sourceDEX}
                  onChange={(e) => setOracleForm(prev => ({ ...prev, sourceDEX: e.target.value }))}
                  placeholder="uniswap_v3"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token Pair
                </label>
                <input
                  type="text"
                  value={oracleForm.tokenPair}
                  onChange={(e) => setOracleForm(prev => ({ ...prev, tokenPair: e.target.value }))}
                  placeholder="ETH/USDC"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Interval (seconds)
                </label>
                <input
                  type="number"
                  value={oracleForm.updateInterval}
                  onChange={(e) => setOracleForm(prev => ({ ...prev, updateInterval: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                onClick={handleCreateOracle}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Price Oracle'}
              </button>
            </div>
            {results.oracle && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.oracle, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Identity Aggregation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Identity Aggregation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Address
                </label>
                <input
                  type="text"
                  value={identityForm.userAddress}
                  onChange={(e) => setIdentityForm(prev => ({ ...prev, userAddress: e.target.value }))}
                  placeholder="042d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chains (comma-separated)
                </label>
                <input
                  type="text"
                  value={identityForm.chains.join(', ')}
                  onChange={(e) => setIdentityForm(prev => ({ ...prev, chains: e.target.value.split(',').map(s => s.trim()) }))}
                  placeholder="ethereum, polkadot, solana"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={identityForm.includeBalances}
                    onChange={(e) => setIdentityForm(prev => ({ ...prev, includeBalances: e.target.checked }))}
                    className="mr-2"
                  />
                  Include Balances
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={identityForm.includeTransactions}
                    onChange={(e) => setIdentityForm(prev => ({ ...prev, includeTransactions: e.target.checked }))}
                    className="mr-2"
                  />
                  Include Transactions
                </label>
              </div>
              <button
                onClick={handleAggregateIdentity}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Aggregating...' : 'Aggregate Identity'}
              </button>
            </div>
            {results.identity && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.identity, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Cross-Chain Transfer */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Cross-Chain Transfer</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Chain
                  </label>
                  <select
                    value={transferForm.fromChain}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, fromChain: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="polkadot">Polkadot</option>
                    <option value="solana">Solana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Chain
                  </label>
                  <select
                    value={transferForm.toChain}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, toChain: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="polkadot">Polkadot</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="solana">Solana</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Address
                </label>
                <input
                  type="text"
                  value={transferForm.fromAddress}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, fromAddress: e.target.value }))}
                  placeholder="042d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Address
                </label>
                <input
                  type="text"
                  value={transferForm.toAddress}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, toAddress: e.target.value }))}
                  placeholder="5GrwvaEF5Xb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="1.0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token
                  </label>
                  <input
                    type="text"
                    value={transferForm.token}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, token: e.target.value }))}
                    placeholder="ETH"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <button
                onClick={handleCrossChainTransfer}
                disabled={loading}
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Transferring...' : 'Execute Transfer'}
              </button>
            </div>
            {results.transfer && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.transfer, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Example Usage */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">📝 Example Usage</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Storage Query Examples:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li><strong>EVM:</strong> <code>0x1234567891234567890123456789012345678900</code> (contract:slot)</li>
                <li><strong>Substrate:</strong> <code>balances.freeBalance:5GrwvaEF5Xb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY</code> (pallet.item:address)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Demo Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>✅ Real EVM storage queries using ethers.js</li>
                <li>✅ Real Substrate storage queries using @polkadot/api</li>
                <li>✅ Simulated cross-chain transfers with realistic responses</li>
                <li>✅ Price oracle creation and management</li>
                <li>✅ Cross-chain identity aggregation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 