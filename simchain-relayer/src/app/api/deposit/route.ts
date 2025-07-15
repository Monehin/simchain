import { NextRequest, NextResponse } from 'next/server';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SimchainClient } from '../../../lib/simchain-client';

export async function POST(request: NextRequest) {
  try {
    const { sim, amount, country = 'RW' } = await request.json();
    
    if (!sim || !amount) {
      return NextResponse.json(
        { success: false, error: 'SIM number and amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
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

    // Deposit funds using actual blockchain transaction
    const result = await client.depositFundsRelay(sim, amount, country);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully deposited ${amount} lamports to wallet ${sim}`,
        signature: result.signature,
        client: '@solana/kit + @solana/web3.js'
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