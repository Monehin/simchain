import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { connection, programId } from '../../../lib/solana';
import { SimchainClient } from '../../../lib/simchain-client';

export async function POST(request: NextRequest) {
  try {
    const { sim, pin } = await request.json();
    
    if (!sim || !pin) {
      return NextResponse.json({ error: 'Missing sim or pin' }, { status: 400 });
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

    // Check if wallet already exists
    const exists = await client.walletExists(sim);
    if (exists) {
      return NextResponse.json({ 
        error: 'Wallet already exists for this SIM number',
        sim: sim 
      }, { status: 409 });
    }

    // For now, return success (actual wallet creation would require more complex setup)
    return NextResponse.json({ 
      message: `Wallet creation initiated for ${sim}`,
      sim: sim,
      note: 'Wallet creation requires additional setup with Config and MintRegistry initialization'
    });

  } catch (error: unknown) {
    console.error('Error creating wallet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create wallet';
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
} 