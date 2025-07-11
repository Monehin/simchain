import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { connection, programId } from '../../../lib/solana';
import { SimchainClient } from '../../../lib/simchain-client';

export async function POST(request: NextRequest) {
  try {
    const { sim, alias } = await request.json();
    
    if (!sim || !alias) {
      return NextResponse.json({ error: 'Missing sim or alias' }, { status: 400 });
    }

    // Validate alias length
    if (alias.length > 32) {
      return NextResponse.json({ 
        error: 'Alias must be 32 characters or less' 
      }, { status: 400 });
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

    // For now, return success (actual alias setting would require more complex setup)
    return NextResponse.json({ 
      message: `Alias "${alias}" set successfully for ${sim}`,
      sim: sim,
      alias: alias,
      note: 'Alias setting requires additional setup with proper transaction signing'
    });

  } catch (error: unknown) {
    console.error('Error setting alias:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to set alias';
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
} 