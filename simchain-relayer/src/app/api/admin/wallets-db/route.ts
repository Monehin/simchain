import { NextResponse } from 'next/server';
import { DatabaseService } from '../../../../lib/database';

export async function GET() {
  try {
    const wallets = await DatabaseService.getAllWallets();
    const count = await DatabaseService.getWalletCount();

    return NextResponse.json({ 
      success: true, 
      wallets: wallets.map((wallet: any) => ({
        id: wallet.id,
        simNumber: wallet.simNumber,
        walletAddress: wallet.walletAddress,
        alias: wallet.alias || 'No alias',
        ownerAddress: wallet.ownerAddress,
        simHash: wallet.simHash,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      })),
      total: count
    });

  } catch (error: unknown) {
    console.error('Error fetching wallets from database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wallets';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 