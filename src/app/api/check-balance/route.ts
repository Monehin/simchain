import { NextRequest, NextResponse } from 'next/server';
import { connection, programId } from '@/lib/solana';
import { deriveWalletPDA, formatSOL } from '@/lib/sim-utils';
import { SimchainClient } from '../../../utils/simchainClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sim = searchParams.get('sim');

    if (!sim) {
      return NextResponse.json(
        { error: 'SIM number is required' },
        { status: 400 }
      );
    }

    // Use hardcoded salt for demo
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    
    // Derive wallet PDA
    const [walletPda] = deriveWalletPDA(sim, salt, programId);

    // Check if wallet exists
    const walletAccount = await connection.getAccountInfo(walletPda);
    if (!walletAccount) {
      return NextResponse.json(
        { error: 'Wallet not found for this SIM number' },
        { status: 404 }
      );
    }

    // Get balance
    const balance = await connection.getBalance(walletPda);
    const formattedBalance = formatSOL(balance);

    const response = `Balance: ${formattedBalance} SOL`;

    return NextResponse.json({ 
      success: true, 
      message: response,
      balance: balance,
      formattedBalance: formattedBalance
    });

  } catch (error) {
    console.error('Check balance error:', error);
    return NextResponse.json(
      { error: 'Failed to check balance' },
      { status: 500 }
    );
  }
} 