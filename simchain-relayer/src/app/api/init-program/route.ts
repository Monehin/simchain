import { NextResponse } from 'next/server';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SimchainClient } from '../../../lib/simchain-client';
import { PROGRAM_ID } from '@/config/programId';

export async function POST() {
  try {
    // Initialize the real blockchain client
    const rpcEndpoint = process.env.SOLANA_CLUSTER_URL || 'http://127.0.0.1:8899';
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
      connection: { rpcEndpoint },
      programId,
      wallet,
      commitment: 'confirmed'
    });

    // Test connection first
    const isConnected = await client.testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'Failed to connect to Solana cluster' },
        { status: 500 }
      );
    }

    // Initialize config account
    let configSignature: string;
    try {
      configSignature = await client.initializeConfig();
      console.log('Config initialized with signature:', configSignature);
    } catch (error: unknown) {
      console.error('Config initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Config initialization failed';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Initialize registry account
    let registrySignature: string;
    try {
      registrySignature = await client.initializeRegistry();
      console.log('Registry initialized with signature:', registrySignature);
    } catch (error: unknown) {
      console.error('Registry initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registry initialization failed';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Program initialized successfully',
        configSignature,
        registrySignature,
        client: '@solana/kit'
      }
    });
    
  } catch (error: unknown) {
    console.error('Program initialization failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 