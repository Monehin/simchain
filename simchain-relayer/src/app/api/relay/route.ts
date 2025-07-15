import { NextRequest, NextResponse } from 'next/server';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SimchainClient } from '../../../lib/simchain-client';
import { WalletDatabase } from '../../../lib/database';
import { PhoneEncryption } from '../../../lib/encryption';
import { ErrorLogger } from '../../../lib/audit-log';

// Initialize the real blockchain client
const getClient = () => {
  const rpcEndpoint = process.env.SOLANA_CLUSTER_URL || 'http://127.0.0.1:8899';
  const programId = new PublicKey(process.env.PROGRAM_ID || 'DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r');
  
  const privateKeyString = process.env.WALLET_PRIVATE_KEY;
  if (!privateKeyString) {
    throw new Error('Wallet private key not configured');
  }
  
  const privateKeyBytes = Uint8Array.from(JSON.parse(privateKeyString));
  const wallet = Keypair.fromSecretKey(privateKeyBytes);
  
  return new SimchainClient({
    connection: { rpcEndpoint },
    programId,
    wallet,
    commitment: 'confirmed'
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'wallet-exists':
        return await handleWalletExists(params);
      
      case 'wallet-info':
        return await handleWalletInfo(params);
      
      case 'wallet-balance':
        return await handleWalletBalance(params);
      
      case 'health-check':
        return await handleHealthCheck();
      
      case 'initialize-wallet':
        return await handleInitializeWallet(params);
      
      case 'verify-pin':
        return await handleVerifyPin(params);
      
      case 'set-alias':
        return await handleSetAlias(params);
      
      case 'send-funds':
        return await handleSendFunds(params);
      
      case 'deposit-funds':
        return await handleDepositFunds(params);
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Relay API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleWalletExists(params: { sim?: string }) {
  try {
    const { sim } = params;
    if (!sim) {
      return NextResponse.json(
        { success: false, error: 'SIM number required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!PhoneEncryption.validatePhoneNumber(sim)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if wallet exists in database
    const wallet = await WalletDatabase.findWalletBySim(sim);
    const exists = wallet !== null;

    return NextResponse.json({
      success: true,
      data: { exists }
    });

  } catch (error: unknown) {
    console.error('Wallet exists check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleWalletInfo(params: { sim?: string }) {
  try {
    const { sim } = params;
    if (!sim) {
      return NextResponse.json(
        { success: false, error: 'SIM number required' },
        { status: 400 }
      );
    }

    // Get wallet from database
    const wallet = await WalletDatabase.findWalletBySim(sim);
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Get balance from blockchain
    const client = getClient();
    const balance = await client.checkBalance({ sim, country: wallet.country });

    return NextResponse.json({
      success: true,
      data: {
        sim,
        balance,
        exists: true,
        alias: wallet.alias || 'unknown',
        walletAddress: wallet.walletAddress,
        message: 'Wallet info retrieved successfully'
      }
    });

  } catch (error: unknown) {
    console.error('Wallet info failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleWalletBalance(params: { sim?: string }) {
  try {
    const { sim } = params;
    if (!sim) {
      return NextResponse.json(
        { success: false, error: 'SIM number required' },
        { status: 400 }
      );
    }

    // Get wallet from database
    const wallet = await WalletDatabase.findWalletBySim(sim);
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Get balance from blockchain
    const client = getClient();
    const balance = await client.checkBalance({ sim, country: wallet.country });

    return NextResponse.json({
      success: true,
      data: { balance, currency: 'SOL' }
    });

  } catch (error: unknown) {
    console.error('Wallet balance failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleHealthCheck() {
  try {
    const client = getClient();
    const isConnected = await client.testConnection();
    
    return NextResponse.json({
      success: true,
      data: {
        connected: isConnected,
        programId: process.env.PROGRAM_ID || 'DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r',
        message: 'Health check completed'
      }
    });

  } catch (error: unknown) {
    console.error('Health check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleInitializeWallet(params: { sim?: string, pin?: string }) {
  try {
    const { sim, pin } = params;
    if (!sim || !pin) {
      return NextResponse.json(
        { success: false, error: 'SIM number and PIN required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!PhoneEncryption.validatePhoneNumber(sim)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (!/^[0-9]{6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Check if wallet already exists
    const existingWallet = await WalletDatabase.findWalletBySim(sim);
    if (existingWallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet already exists for this phone number' },
        { status: 409 }
      );
    }

    // Create wallet on blockchain
    const client = getClient();
    const transactionSignature = await client.initializeWallet({ 
      sim, 
      pin, 
      country: 'RW' 
    });

    // Log successful wallet creation
    await ErrorLogger.log({
      action: 'WALLET_CREATED',
      alias: 'NEW_WALLET',
      errorMessage: 'Wallet created successfully',
      metadata: {
        sim,
        country: 'RW'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        signature: transactionSignature,
        message: 'Wallet initialized successfully'
      }
    });

  } catch (error: unknown) {
    console.error('Wallet initialization failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Log error
    await ErrorLogger.log({
      action: 'WALLET_CREATION_ERROR',
      alias: 'NEW_WALLET',
      errorMessage: errorMessage,
      metadata: {
        sim: params.sim
      }
    });
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleVerifyPin(params: { sim?: string, pin?: string }) {
  try {
    const { sim, pin } = params;
    if (!sim || !pin) {
      return NextResponse.json(
        { success: false, error: 'SIM number and PIN required' },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (!/^[0-9]{6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Check if wallet exists
    const wallet = await WalletDatabase.findWalletBySim(sim);
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // For now, we'll accept any 6-digit PIN since we don't store PINs
    // In a real implementation, you'd verify against stored PIN hash
    return NextResponse.json({
      success: true,
      data: { verified: true }
    });

  } catch (error: unknown) {
    console.error('PIN verification failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleSetAlias(params: { sim?: string, alias?: string }) {
  try {
    const { sim, alias } = params;
    if (!sim || !alias) {
      return NextResponse.json(
        { success: false, error: 'SIM number and alias required' },
        { status: 400 }
      );
    }

    // Get wallet from database
    const wallet = await WalletDatabase.findWalletBySim(sim);
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Update alias on blockchain
    const client = getClient();
    const transactionSignature = await client.setAlias({ 
      sim, 
      alias, 
      country: wallet.country 
    });

    // Update alias in database
    await WalletDatabase.updateWalletAlias(sim, alias);

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        signature: transactionSignature,
        message: 'Alias updated successfully'
      }
    });

  } catch (error: unknown) {
    console.error('Set alias failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleSendFunds(params: { fromSim?: string, toSim?: string, amount?: number, pin?: string }) {
  try {
    const { fromSim, toSim, amount, pin } = params;
    if (!fromSim || !toSim || !amount || !pin) {
      return NextResponse.json(
        { success: false, error: 'All parameters required' },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (!/^[0-9]{6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Send funds on blockchain
    const client = getClient();
    const transactionSignature = await client.sendFunds({ 
      fromSim, 
      toSim, 
      amount, 
      fromCountry: 'RW',
      toCountry: 'RW'
    });

      return NextResponse.json({
        success: true,
        data: { 
        success: true,
        signature: transactionSignature,
        message: 'Funds sent successfully'
      }
    });

  } catch (error: unknown) {
    console.error('Send funds failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleDepositFunds(params: { sim?: string, amount?: number }) {
  try {
    const { sim, amount } = params;
    if (!sim || !amount) {
      return NextResponse.json(
        { success: false, error: 'SIM number and amount required' },
        { status: 400 }
      );
    }

    // Deposit funds on blockchain
    const client = getClient();
    const transactionSignature = await client.depositFunds({ 
      sim, 
      amount, 
      country: 'RW'
    });

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        signature: transactionSignature,
        message: 'Funds deposited successfully'
      }
    });

  } catch (error: unknown) {
    console.error('Deposit funds failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

 