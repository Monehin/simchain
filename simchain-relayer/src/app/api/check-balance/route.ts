import { NextRequest, NextResponse } from 'next/server';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SimchainClient } from '../../../lib/simchain-client';
import { ErrorLogger } from '../../../lib/audit-log';
import { PinValidator } from '../../../lib/validation';
import { WalletDatabase } from '../../../lib/database';
import { PhoneEncryption } from '../../../lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const { sim, pin, country = 'RW' } = await request.json();
    
    if (!sim || !pin) {
      return NextResponse.json(
        { success: false, error: 'SIM number and PIN are required' },
        { status: 400 }
      );
    }
    
    if (!PinValidator.validatePin(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!PhoneEncryption.validatePhoneNumber(sim)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Please use international format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    // Check if phone number is registered
    const isRegistered = await WalletDatabase.isPhoneNumberRegistered(sim);
    if (!isRegistered) {
      return NextResponse.json(
        { success: false, error: 'Phone number is not registered' },
        { status: 404 }
      );
    }

    // Initialize the real blockchain client
    const programId = new PublicKey(process.env.PROGRAM_ID || 'DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r');
    
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

    try {
      const walletRecord = await WalletDatabase.findWalletBySim(sim);
      if (!walletRecord) {
        return NextResponse.json({ success: false, error: 'Wallet not found for this phone number.' }, { status: 404 });
      }
      const balanceLamports = await client.checkBalance({ sim, country });
      const balance = balanceLamports / 1e9;
      return NextResponse.json({
        success: true,
        data: {
          alias: walletRecord.alias || 'unknown',
          balance
        }
      });
    } catch (error: unknown) {
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not registered')) {
        errorMessage = 'Wallet not found for this phone number.';
      }
      return NextResponse.json({ success: false, error: errorMessage }, { status: 404 });
    }
    
  } catch (error: unknown) {
    console.error('Check balance failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 