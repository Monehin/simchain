import { NextRequest, NextResponse } from 'next/server';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SimchainClient } from '../../../lib/simchain-client';
import { PinValidator } from '../../../lib/validation';
import { WalletDatabase } from '../../../lib/database';
import { PROGRAM_ID } from '@/config/programId';

export async function POST(request: NextRequest) {
  try {
    const { fromSim, toSim, amount, pin, country = 'RW' } = await request.json();
    
    if (!fromSim || !toSim || !amount || !pin) {
      return NextResponse.json(
        { success: false, error: 'fromSim, toSim, amount, and pin are required' },
        { status: 400 }
      );
    }
    
    if (!PinValidator.validatePin(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
    const lamports = Math.floor(amount * 1_000_000_000);
    
    if (lamports <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount is too small (minimum 0.000000001 SOL)' },
        { status: 400 }
      );
    }

    // Initialize the real blockchain client
    const programId = new PublicKey(PROGRAM_ID);
    
    // Create a wallet keypair from the private key
    const privateKeyString = process.env.WALLET_PRIVATE_KEY;
    if (!privateKeyString) {
      return NextResponse.json(
        { success: false, error: 'Wallet private key not configured' },
        { status: 500 }
      );
    }
    
    const privateKeyBytes = Uint8Array.from(JSON.parse(privateKeyString));
    const wallet = Keypair.fromSecretKey(privateKeyBytes);
    
    const client = new SimchainClient({
      connection: { rpcEndpoint: process.env.SOLANA_CLUSTER_URL || 'http://127.0.0.1:8899' },
      programId,
      wallet,
      commitment: 'confirmed'
    });

    let result: string;
    try {
      result = await client.sendFunds({ fromSim, toSim, amount: lamports, pin, fromCountry: country, toCountry: country });
    } catch (error: unknown) {
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Simulation failed')) {
        if (errorMessage.includes('Insufficient available balance')) {
          errorMessage = 'Insufficient balance in sender wallet.';
        } else if (errorMessage.includes('already in use')) {
          errorMessage = 'Transaction failed: account already exists or is in use.';
        } else {
          errorMessage = 'Transaction failed: check details or contact support.';
        }
      }
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }
    
    // Fund transfer successful - no need to log success

    let fromAlias: string = 'unknown';
    let toAlias: string = 'unknown';
    try {
      const fromWallet = await WalletDatabase.findWalletBySim(fromSim);
      if (fromWallet) fromAlias = fromWallet.alias || 'unknown';
      const toWallet = await WalletDatabase.findWalletBySim(toSim);
      if (toWallet) toAlias = toWallet.alias || 'unknown';
    } catch {}
    return NextResponse.json({
      success: true,
      data: {
        message: 'Funds sent successfully',
        fromAlias,
        toAlias,
        amount,
        signature: result
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