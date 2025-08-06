import React, { useState, useEffect } from 'react';
import { getWalletBalance, sendEthToSol, sendSolToEth, getTransferLogs } from './simchainRelayer';

interface TransferLog {
  id: string;
  type: 'wallet' | 'ethereum' | 'solana' | 'cross-chain';
  action: string;
  amount?: number;
  from?: string;
  to?: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  chain?: 'ethereum' | 'solana' | 'both';
}

function App() {
  // State for wallet actions
  const [sim, setSim] = useState('');
  const [pin, setPin] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [ethToSolAmount, setEthToSolAmount] = useState('');
  const [solToEthAmount, setSolToEthAmount] = useState('');
  const [logs, setLogs] = useState<TransferLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh logs every 10 seconds
  useEffect(() => {
    if (!autoRefresh || !sim || !pin) return;
    
    const interval = setInterval(async () => {
      try {
        const transferData = await getTransferLogs(sim, pin);
        updateLogsFromAPI(transferData);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, sim, pin]);

  // Update logs from API response
  const updateLogsFromAPI = (data: any) => {
    const newLogs: TransferLog[] = [];
    
    // Add wallet transactions
    if (data.wallet && Array.isArray(data.wallet)) {
      data.wallet.forEach((tx: any) => {
        newLogs.push({
          id: `wallet-${Date.now()}-${Math.random()}`,
          type: 'wallet',
          action: tx.action || 'Wallet operation',
          amount: tx.amount,
          status: tx.status || 'success',
          timestamp: tx.timestamp || new Date().toISOString(),
          chain: 'both'
        });
      });
    }

    // Add Ethereum transactions
    if (data.ethereum && data.ethereum.result) {
      newLogs.push({
        id: `eth-${Date.now()}`,
        type: 'ethereum',
        action: 'Ethereum transaction count',
        amount: parseInt(data.ethereum.result, 16),
        status: 'success',
        timestamp: new Date().toISOString(),
        chain: 'ethereum'
      });
    }

    // Add Solana transactions
    if (data.solana && data.solana.result) {
      newLogs.push({
        id: `sol-${Date.now()}`,
        type: 'solana',
        action: 'Solana transaction count',
        amount: data.solana.result,
        status: 'success',
        timestamp: new Date().toISOString(),
        chain: 'solana'
      });
    }

    setLogs(prev => [...newLogs, ...prev]);
  };

  // Fetch wallet balance
  const fetchBalance = async () => {
    setLoading(true);
    try {
      const result = await getWalletBalance(sim, pin);
      setBalance(result.balance);
      
      // Add to logs
      const newLog: TransferLog = {
        id: `balance-${Date.now()}`,
        type: 'wallet',
        action: `Checked balance for SIM ${sim}`,
        amount: result.balance,
        status: 'success',
        timestamp: new Date().toISOString(),
        chain: 'both'
      };
      setLogs(prev => [newLog, ...prev]);
    } catch (e) {
      const errorLog: TransferLog = {
        id: `error-${Date.now()}`,
        type: 'wallet',
        action: `Failed to fetch balance for SIM ${sim}`,
        status: 'failed',
        timestamp: new Date().toISOString(),
        chain: 'both'
      };
      setLogs(prev => [errorLog, ...prev]);
      alert('Failed to fetch balance');
    }
    setLoading(false);
  };

  // Send ETH->Sol
  const sendEthToSolHandler = async () => {
    setLoading(true);
    const newLog: TransferLog = {
      id: `eth-sol-${Date.now()}`,
      type: 'cross-chain',
      action: `Sending ${ethToSolAmount} tokens from Ethereum to Solana`,
      amount: Number(ethToSolAmount),
      status: 'pending',
      timestamp: new Date().toISOString(),
      chain: 'both'
    };
    setLogs(prev => [newLog, ...prev]);

    try {
      const result = await sendEthToSol(sim, pin, Number(ethToSolAmount));
      
      // Update log with success
      setLogs(prev => prev.map(log => 
        log.id === newLog.id 
          ? { ...log, status: 'success', action: `✅ Sent ${ethToSolAmount} tokens from Ethereum to Solana` }
          : log
      ));
    } catch (e) {
      // Update log with failure
      setLogs(prev => prev.map(log => 
        log.id === newLog.id 
          ? { ...log, status: 'failed', action: `❌ Failed to send ${ethToSolAmount} tokens from Ethereum to Solana` }
          : log
      ));
      alert('Failed to send ETH to Solana');
    }
    setLoading(false);
  };

  // Send Sol->ETH
  const sendSolToEthHandler = async () => {
    setLoading(true);
    const newLog: TransferLog = {
      id: `sol-eth-${Date.now()}`,
      type: 'cross-chain',
      action: `Sending ${solToEthAmount} tokens from Solana to Ethereum`,
      amount: Number(solToEthAmount),
      status: 'pending',
      timestamp: new Date().toISOString(),
      chain: 'both'
    };
    setLogs(prev => [newLog, ...prev]);

    try {
      const result = await sendSolToEth(sim, pin, Number(solToEthAmount));
      
      // Update log with success
      setLogs(prev => prev.map(log => 
        log.id === newLog.id 
          ? { ...log, status: 'success', action: `✅ Sent ${solToEthAmount} tokens from Solana to Ethereum` }
          : log
      ));
    } catch (e) {
      // Update log with failure
      setLogs(prev => prev.map(log => 
        log.id === newLog.id 
          ? { ...log, status: 'failed', action: `❌ Failed to send ${solToEthAmount} tokens from Solana to Ethereum` }
          : log
      ));
      alert('Failed to send Solana to ETH');
    }
    setLoading(false);
  };

  // Refresh logs manually
  const refreshLogs = async () => {
    if (!sim || !pin) return;
    try {
      const transferData = await getTransferLogs(sim, pin);
      updateLogsFromAPI(transferData);
    } catch (error) {
      console.error('Failed to refresh logs:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#757575';
    }
  };

  // Get chain icon
  const getChainIcon = (chain?: string) => {
    switch (chain) {
      case 'ethereum': return '🔷';
      case 'solana': return '🟣';
      case 'both': return '🔗';
      default: return '📋';
    }
  };

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <h1>Crosschain Hyperbridge</h1>
      
      <section style={{ marginBottom: 32 }}>
        <h2>Check Wallet Balance</h2>
        <input placeholder="SIM" value={sim} onChange={e => setSim(e.target.value)} />{' '}
        <input placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)} type="password" />{' '}
        <button onClick={fetchBalance} disabled={loading}>Check Balance</button>
        {balance !== null && <div style={{ marginTop: 8 }}>Balance: <b>{balance}</b></div>}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Send Tokens</h2>
        <div style={{ marginBottom: 8 }}>
          <b>Ethereum → Solana:</b>{' '}
          <input type="number" placeholder="Amount" value={ethToSolAmount} onChange={e => setEthToSolAmount(e.target.value)} />{' '}
          <button onClick={sendEthToSolHandler} disabled={loading || !ethToSolAmount}>Send</button>
        </div>
        <div>
          <b>Solana → Ethereum:</b>{' '}
          <input type="number" placeholder="Amount" value={solToEthAmount} onChange={e => setSolToEthAmount(e.target.value)} />{' '}
          <button onClick={sendSolToEthHandler} disabled={loading || !solToEthAmount}>Send</button>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Transfer Logs</h2>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={e => setAutoRefresh(e.target.checked)}
              /> Auto-refresh
            </label>
            <button onClick={refreshLogs} style={{ marginLeft: 16 }} disabled={!sim || !pin}>
              🔄 Refresh
            </button>
          </div>
        </div>
        
        <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 6, maxHeight: 400, overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <span>No logs yet. Enter SIM and PIN, then check balance or send tokens.</span>
          ) : (
            <div>
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  style={{ 
                    padding: 8, 
                    margin: '4px 0', 
                    borderLeft: `4px solid ${getStatusColor(log.status)}`,
                    background: 'white',
                    borderRadius: 4
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {getChainIcon(log.chain)} {log.action}
                      {log.amount && <span style={{ color: '#666' }}> ({log.amount})</span>}
                    </span>
                    <span style={{ fontSize: '0.8em', color: '#666' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <p style={{color: 'gray', marginTop: 32}}>
        Edit <code>src/App.tsx</code> to customize bridge logic and connect to real contracts.
      </p>
    </div>
  );
}

export default App;
