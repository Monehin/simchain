// Utility for simchain-relayer API integration
export async function getWalletBalance(sim: string, pin: string) {
  const res = await fetch('http://localhost:3000/api/check-balance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sim, pin })
  });
  if (!res.ok) throw new Error('Failed to fetch balance');
  return res.json();
}

// Get wallet transaction history from relayer
export async function getWalletTransactions(sim: string, pin: string) {
  const res = await fetch('http://localhost:3002/api/audit-logs', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    // Add query parameters for filtering by SIM
  });
  if (!res.ok) throw new Error('Failed to fetch wallet transactions');
  return res.json();
}

// Get Ethereum chain transactions
export async function getEthereumTransactions(address: string) {
  const res = await fetch(`http://127.0.0.1:8545`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [address, 'latest'],
      id: 1
    })
  });
  if (!res.ok) throw new Error('Failed to fetch Ethereum transactions');
  return res.json();
}

// Get Solana chain transactions
export async function getSolanaTransactions(address: string) {
  const res = await fetch(`http://127.0.0.1:8899`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getTransactionCount',
      params: [address],
      id: 1
    })
  });
  if (!res.ok) throw new Error('Failed to fetch Solana transactions');
  return res.json();
}

// Send tokens from Ethereum to Solana
export async function sendEthToSol(sim: string, pin: string, amount: number) {
  const res = await fetch('http://localhost:3002/api/cross-chain-conversion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sim, pin, amount, direction: 'eth-to-sol' })
  });
  if (!res.ok) throw new Error('Failed to send ETH to Solana');
  return res.json();
}

// Send tokens from Solana to Ethereum
export async function sendSolToEth(sim: string, pin: string, amount: number) {
  const res = await fetch('http://localhost:3002/api/cross-chain-conversion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sim, pin, amount, direction: 'sol-to-eth' })
  });
  if (!res.ok) throw new Error('Failed to send Solana to ETH');
  return res.json();
}

// Get real-time transfer logs from both chains
export async function getTransferLogs(sim: string, pin: string) {
  try {
    // Get wallet transactions from simchain-relayer
    const walletTxs = await getWalletTransactions(sim, pin);
    
    // Get chain-specific transactions (stubbed for now)
    const ethTxs = await getEthereumTransactions('0x123...'); // Replace with actual wallet address
    const solTxs = await getSolanaTransactions('ABC123...'); // Replace with actual wallet address
    
    return {
      wallet: walletTxs,
      ethereum: ethTxs,
      solana: solTxs,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching transfer logs:', error);
    return { wallet: [], ethereum: [], solana: [], timestamp: new Date().toISOString() };
  }
} 