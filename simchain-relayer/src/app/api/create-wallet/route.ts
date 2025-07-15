import { NextRequest, NextResponse } from 'next/server';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SimchainClient, PinValidator } from '../../../lib/simchain-client';
import { WalletDatabase } from '../../../lib/database';
import { PhoneEncryption } from '../../../lib/encryption';
import { ErrorLogger } from '../../../lib/audit-log';

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

    // Check if phone number is already registered
    const isRegistered = await WalletDatabase.isPhoneNumberRegistered(sim);
    if (isRegistered) {
      return NextResponse.json(
        { success: false, error: 'Phone number is already registered' },
        { status: 409 }
      );
    }

    // Initialize the real blockchain client
    const rpcEndpoint = process.env.SOLANA_CLUSTER_URL || 'http://127.0.0.1:8899';
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
      connection: { rpcEndpoint },
      programId,
      wallet,
      commitment: 'confirmed'
    });

    // Create wallet using @solana/kit
    let result: string;
    try {
      result = await client.initializeWallet({ sim, pin, country });
    } catch (error: any) {
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Simulation failed')) {
        // Try to extract more details from the error logs
        if (errorMessage.includes('already in use')) {
          errorMessage = 'Wallet already exists for this phone number.';
        } else {
          errorMessage = 'Wallet creation failed. Please try again or contact support.';
        }
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }
    
    // Extract wallet address from the result
    // The result should contain the wallet address or we can derive it
    let walletAddress: string;
    let transactionSignature: string;
    
    try {
      // The result should be a transaction signature, not a wallet address
      if (typeof result === 'string') {
        transactionSignature = result;
        // Derive wallet address from SIM and program
        const [walletPDA] = await client.createWalletPDA(sim);
        walletAddress = walletPDA.toBase58();
      } else {
        throw new Error('Invalid result format from wallet initialization');
      }
    } catch (error) {
      console.error('Failed to extract wallet address:', error);
      walletAddress = 'unknown'; // Fallback
      transactionSignature = 'unknown';
    }

    // Store encrypted wallet data in database
    let alias: string = 'unknown';
    try {
      console.log('Attempting to store wallet in database...');
      console.log('SIM:', sim);
      console.log('Wallet Address:', walletAddress);
      console.log('Country:', country);
      
      const walletRecord = await WalletDatabase.createWallet({
        sim,
        walletAddress,
        country
      });
      
      console.log('Wallet stored successfully in database');
      console.log('Generated alias:', walletRecord.alias);
      
      alias = walletRecord.alias || 'unknown';
      // Wallet created successfully - no need to log success
    } catch (dbError) {
      console.error('Failed to store wallet in database:', dbError);
      if (dbError instanceof Error && dbError.stack) {
        console.error('Database error stack:', dbError.stack);
      }
      // Log the database error
      await ErrorLogger.logWalletCreationError('ALIAS_NOT_AVAILABLE', dbError instanceof Error ? dbError.message : 'Database error', 'DB_ERROR', {
        transactionSignature,
        country
      });
      // Don't fail the request if database storage fails
      // The blockchain transaction was successful
    }
    return NextResponse.json({
      success: true,
      data: {
        message: 'Wallet initialized successfully',
        walletAddress,
        transactionSignature,
        alias,
        client: '@solana/kit',
        encrypted: true
      }
    });
    
  } catch (error: unknown) {
    console.error('Create wallet failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 