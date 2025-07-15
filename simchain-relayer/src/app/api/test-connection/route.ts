import { NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { SimchainClient } from '../../../lib/simchain-client';
import { PROGRAM_ID } from '@/config/programId';

export async function GET() {
  try {
    console.log('Starting test connection...');
    
    // Initialize the real blockchain client
    const rpcEndpoint = process.env.SOLANA_CLUSTER_URL || 'http://127.0.0.1:8899';
    const programId = new PublicKey(PROGRAM_ID);
    
    console.log('RPC endpoint and programId created');
    
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
    
    console.log('Wallet keypair created');
    
    console.log('Creating SimchainClient with @solana/kit...');
    const client = new SimchainClient({
      connection: { rpcEndpoint },
      programId,
      wallet,
      commitment: 'confirmed'
    });
    
    console.log('SimchainClient created successfully');

    // Test the connection using @solana/kit
    const isConnected = await client.testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'Connection failed' },
        { status: 500 }
      );
    }

    // Check if the program exists on the blockchain
    let programExists = false;
    try {
      const connection = new Connection(rpcEndpoint, 'confirmed');
      const programInfo = await connection.getAccountInfo(programId);
      programExists = programInfo !== null;
      console.log('Program exists check:', programExists);
    } catch (error) {
      console.error('Error checking program existence:', error);
      programExists = false;
    }

    // Get program accounts count to demonstrate @solana/kit functionality
    const programAccountsCount = await client.getProgramAccounts();

    return NextResponse.json({
      success: true,
      data: {
        connected: isConnected,
        programId: programId.toBase58(),
        programExists,
        programAccountsCount,
        client: '@solana/kit'
      }
    });
    
  } catch (error: unknown) {
    console.error('Test connection failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 