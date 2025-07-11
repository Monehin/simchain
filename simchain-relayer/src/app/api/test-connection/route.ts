import { NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { connection, programId } from '../../../lib/solana';
import { SimchainClient } from '../../../lib/simchain-client';

export async function GET() {
  try {
    // Create a temporary keypair for testing
    const testWallet = Keypair.generate();
    
    // Test connection by requesting a small airdrop
    const airdropSig = await connection.requestAirdrop(testWallet.publicKey, 1000000); // 0.001 SOL
    await connection.confirmTransaction(airdropSig);
    
    // Create SIMChain client
    const client = new SimchainClient({
      connection,
      wallet: testWallet,
      programId,
    });
    
    // Test program connection
    const programInfo = await client.getProgramInfo();
    
    // Test wallet PDA derivation
    const testSim = '+1234567890';
    const [walletPda] = await client.deriveWalletPDA(testSim);
    
    return NextResponse.json({ 
      success: true,
      message: 'Connection to local validator and SIMChain program successful',
      data: {
        validatorConnected: true,
        programId: programInfo.programId,
        programExists: programInfo.exists,
        testWalletPda: walletPda.toBase58(),
        testSim: testSim
      }
    });

  } catch (error: unknown) {
    console.error('Connection test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json({ 
      success: false,
      error: errorMessage 
    }, { status: 500 });
  }
} 