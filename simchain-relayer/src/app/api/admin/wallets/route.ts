import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
const PROGRAM_ID = new PublicKey('DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r');

export async function GET() {
  try {
    // Get all program accounts (wallets)
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          dataSize: 137, // Actual size of wallet account data
        },
      ],
    });

    const wallets = [];

    for (const account of accounts) {
      try {
        // Parse the wallet account data
        const data = account.account.data;
        
        // Skip if not a wallet account (check discriminator)
        if (data.length < 137) continue;
        
        // Extract wallet data
        const simHash = Array.from(data.slice(8, 40)).map(b => b.toString(16).padStart(2, '0')).join('');
        const owner = new PublicKey(data.slice(40, 72));
        const alias = Array.from(data.slice(105, 137)).map(b => String.fromCharCode(b)).join('').replace(/\0/g, '');
        
        // Get balance
        const balance = account.account.lamports / 1e9; // Convert lamports to SOL
        
        wallets.push({
          address: account.pubkey.toBase58(),
          alias: alias || 'No alias',
          balance: balance,
          simHash: `0x${simHash.slice(0, 8)}...${simHash.slice(-8)}`,
          owner: owner.toBase58(),
          createdAt: new Date().toISOString(), // We could extract this from account creation if needed
        });
      } catch (error) {
        console.error('Error parsing wallet account:', error);
        // Continue with other accounts
      }
    }

    // Sort by balance (highest first)
    wallets.sort((a, b) => b.balance - a.balance);

    return NextResponse.json({ 
      success: true, 
      wallets,
      total: wallets.length
    });

  } catch (error: unknown) {
    console.error('Error fetching wallets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wallets';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 