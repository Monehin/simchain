import { NextRequest, NextResponse } from 'next/server';
import { SimchainClient } from '../../../lib/simchain-client';
import { Keypair, PublicKey } from '@solana/web3.js';

export async function POST(request: NextRequest) {
  try {
    const { sim, pin, country = 'NG' } = await request.json();

    // Validate required fields
    if (!sim || !pin) {
      return NextResponse.json(
        { error: 'Missing required fields: sim, pin' },
        { status: 400 }
      );
    }

    // Initialize client
    const programId = new PublicKey(process.env.PROGRAM_ID || 'DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r');
    
    // Create a wallet keypair from the private key
    const privateKeyString = process.env.WALLET_PRIVATE_KEY;
    if (!privateKeyString) {
      return NextResponse.json(
        { error: 'Wallet private key not configured' },
        { status: 500 }
      );
    }
    
    const privateKeyBytes = Uint8Array.from(JSON.parse(privateKeyString));
    const wallet = Keypair.fromSecretKey(privateKeyBytes);
    
    const client = new SimchainClient({
      connection: {
        rpcEndpoint: process.env.SOLANA_CLUSTER_URL || 'http://127.0.0.1:8899',
      },
      programId,
      wallet,
    });

    // Test connection
    const isConnected = await client.testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to Solana network' },
        { status: 500 }
      );
    }

    // Validate PIN on-chain
    const result = await client.validatePinRelay(sim, pin, country);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'PIN validation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      isValid: result.data?.isValid || false,
      message: result.data?.isValid ? 'PIN is valid' : 'PIN is invalid'
    });

  } catch (error) {
    console.error('Validate PIN error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 