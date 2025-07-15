import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/database';

export async function GET() {
  try {
    // Get all wallets
    const wallets = await prisma.encryptedWallet.findMany({
      select: {
        id: true,
        walletAddress: true,
        country: true,
        currentAlias: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get total count
    const totalWallets = await prisma.encryptedWallet.count();

    return NextResponse.json({
      success: true,
      data: {
        totalWallets,
        wallets
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
} 