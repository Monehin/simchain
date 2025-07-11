import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { connection, programId } from '../../../lib/solana';
import { SimchainClient } from '../../../lib/simchain-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sim = searchParams.get('sim');
    
    if (!sim) {
      return NextResponse.json({ error: 'Missing sim parameter' }, { status: 400 });
    }

    // Create a temporary keypair for the relayer
    const relayer = Keypair.generate();
    
    // Airdrop some SOL to the relayer
    const airdropSig = await connection.requestAirdrop(relayer.publicKey, 1000000000); // 1 SOL
    await connection.confirmTransaction(airdropSig);

    const client = new SimchainClient({
      connection,
      wallet: relayer,
      programId,
    });

    // Check if wallet exists
    const exists = await client.walletExists(sim);
    if (!exists) {
      return NextResponse.json({ 
        error: 'Wallet not found for this SIM number',
        sim: sim 
      }, { status: 404 });
    }

    // Get balance
    const balance = await client.getWalletBalance(sim);

    return NextResponse.json({ 
      message: `Balance for ${sim}: ${balance.toFixed(4)} SOL`,
      balance: balance,
      sim: sim 
    });

  } catch (error: unknown) {
    console.error('Error checking balance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check balance';
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
} 