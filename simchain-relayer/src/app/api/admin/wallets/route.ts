import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/database';
import { PublicKey, Connection } from '@solana/web3.js';

// Define proper TypeScript interfaces for the response
interface WalletResponse {
  id: string;
  walletAddress: string;
  country: string;
  alias: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  simHash: string;
}

export async function GET() {
  try {
    // Get all wallets with alias information
    const wallets = await prisma.encryptedWallet.findMany({
      select: {
        id: true,
        walletAddress: true,
        country: true,
        alias: true,
        lastBalance: true,
        createdAt: true,
        updatedAt: true,
        simHash: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Initialize Solana connection
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'http://localhost:8899');

    // Fetch real on-chain balances for each wallet
    const walletsWithBalances: WalletResponse[] = await Promise.all(
      wallets.map(async (wallet): Promise<WalletResponse> => {
        let balance = 0;
        
        try {
          // Fetch real on-chain balance
          const accountInfo = await connection.getAccountInfo(new PublicKey(wallet.walletAddress));
          if (accountInfo) {
            balance = accountInfo.lamports / 1e9; // Convert lamports to SOL
          }
        } catch {
          // Fallback to database balance if on-chain fetch fails
          balance = wallet.lastBalance || 0;
        }

        return {
          id: wallet.id,
          walletAddress: wallet.walletAddress,
          country: wallet.country,
          alias: wallet.alias!, // Non-null assertion since alias is always assigned
          balance: balance,
          createdAt: wallet.createdAt.toISOString(),
          updatedAt: wallet.updatedAt.toISOString(),
          simHash: wallet.simHash
        };
      })
    );

    return NextResponse.json({
      success: true,
      wallets: walletsWithBalances.map(wallet => ({
        address: wallet.walletAddress,
        alias: wallet.alias,
        balance: wallet.balance,
        simHash: wallet.simHash,
        owner: wallet.walletAddress, // For now, owner is the same as wallet address
        createdAt: wallet.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
} 