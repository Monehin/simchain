const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize providers
const ethProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const solanaConnection = new Connection('http://127.0.0.1:8899', 'confirmed');

// Mock wallet for testing (in production, this would be derived from SIM/PIN)
const mockWallet = ethers.Wallet.createRandom().connect(ethProvider);
const mockSolanaWallet = {
  publicKey: new PublicKey('11111111111111111111111111111111'),
  secretKey: new Uint8Array(64)
};

// Store transfer logs
const transferLogs = [];

// API Routes

// Check balance endpoint
app.post('/api/check-balance', async (req, res) => {
  try {
    const { sim, pin } = req.body;
    
    // Mock balance check - in production this would validate SIM/PIN
    if (!sim || !pin) {
      return res.status(400).json({ error: 'Missing SIM or PIN' });
    }
    
    // Get balances from both chains
    const ethBalance = await ethProvider.getBalance(mockWallet.address);
    const solBalance = await solanaConnection.getBalance(mockSolanaWallet.publicKey);
    
    const totalBalance = parseFloat(ethers.formatEther(ethBalance)) + (solBalance / LAMPORTS_PER_SOL);
    
    res.json({ 
      success: true, 
      balance: totalBalance.toFixed(4),
      ethereum: ethers.formatEther(ethBalance),
      solana: (solBalance / LAMPORTS_PER_SOL).toFixed(4)
    });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: 'Failed to check balance' });
  }
});

// Cross-chain conversion endpoint
app.post('/api/cross-chain-conversion', async (req, res) => {
  try {
    console.log('Received cross-chain conversion request:', req.body);
    const { sim, pin, amount, direction } = req.body;
    
    if (!sim || !pin || !amount || !direction) {
      console.log('Missing parameters:', { sim, pin, amount, direction });
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Mock PIN validation
    if (pin !== '1234') {
      console.log('Invalid PIN:', pin);
      return res.status(400).json({ error: 'Invalid PIN' });
    }
    
    const transferId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate cross-chain transfer
    let sourceTx, targetTx;
    
    if (direction === 'eth-to-sol') {
      // Simulate Ethereum to Solana transfer
      sourceTx = `0x${Math.random().toString(16).substr(2, 64)}`;
      targetTx = `${Math.random().toString(16).substr(2, 64)}`;
      
      // Add to logs
      transferLogs.push({
        id: transferId,
        type: 'cross-chain',
        action: `Sent ${amount} tokens from Ethereum to Solana`,
        amount: parseFloat(amount),
        status: 'success',
        timestamp: new Date().toISOString(),
        sourceTx,
        targetTx,
        direction: 'eth-to-sol'
      });
      
    } else if (direction === 'sol-to-eth') {
      // Simulate Solana to Ethereum transfer
      sourceTx = `${Math.random().toString(16).substr(2, 64)}`;
      targetTx = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Add to logs
      transferLogs.push({
        id: transferId,
        type: 'cross-chain',
        action: `Sent ${amount} tokens from Solana to Ethereum`,
        amount: parseFloat(amount),
        status: 'success',
        timestamp: new Date().toISOString(),
        sourceTx,
        targetTx,
        direction: 'sol-to-eth'
      });
    }
    
    res.json({
      success: true,
      transferId,
      sourceTx,
      targetTx,
      status: 'success',
      message: `Successfully transferred ${amount} tokens`
    });
    
  } catch (error) {
    console.error('Cross-chain conversion error:', error);
    res.status(500).json({ error: 'Failed to process cross-chain transfer' });
  }
});

// Audit logs endpoint
app.get('/api/audit-logs', async (req, res) => {
  try {
    // Return recent transfer logs
    const recentLogs = transferLogs.slice(-20); // Last 20 transfers
    res.json({
      success: true,
      logs: recentLogs,
      count: recentLogs.length
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Test connection endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    // Test connections to both chains
    const ethConnected = await ethProvider.getNetwork().then(() => true).catch(() => false);
    const solConnected = await solanaConnection.getVersion().then(() => true).catch(() => false);
    
    res.json({
      success: true,
      ethereum: ethConnected,
      solana: solConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({ error: 'Failed to test connections' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Crosschain Hyperbridge Relayer running on port ${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - POST /api/check-balance`);
  console.log(`   - POST /api/cross-chain-conversion`);
  console.log(`   - GET /api/audit-logs`);
  console.log(`   - GET /api/test-connection`);
  console.log(`🔗 Connected to:`);
  console.log(`   - Ethereum: http://127.0.0.1:8545`);
  console.log(`   - Solana: http://127.0.0.1:8899`);
}); 