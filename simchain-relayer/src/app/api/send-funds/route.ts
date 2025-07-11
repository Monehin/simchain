import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { connection, programId } from '../../../lib/solana';
import { SimchainClient } from '../../../lib/simchain-client';

export async function POST(request: NextRequest) {
  try {
    const { from_sim, to_sim, amount } = await request.json();
    
    if (!from_sim || !to_sim || !amount) {
      return NextResponse.json({ error: 'Missing from_sim, to_sim, or amount' }, { status: 400 });
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

    // Check if both wallets exist
    const fromExists = await client.walletExists(from_sim);
    const toExists = await client.walletExists(to_sim);
    
    if (!fromExists) {
      return NextResponse.json({ 
        error: 'Sender wallet not found',
        from_sim 
      }, { status: 404 });
    }
    
    if (!toExists) {
      return NextResponse.json({ 
        error: 'Recipient wallet not found',
        to_sim 
      }, { status: 404 });
    }

    // For now, return success (actual send would require more complex setup)
    return NextResponse.json({ 
      message: `Fund transfer initiated: ${amount} SOL from ${from_sim} to ${to_sim}`,
      from_sim,
      to_sim,
      amount,
      note: 'Fund transfer requires additional setup with proper transaction signing'
    });

  } catch (error: unknown) {
    console.error('Error sending funds:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send funds';
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
} 