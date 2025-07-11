import { NextRequest, NextResponse } from 'next/server';
import { connection, programId } from '@/lib/solana';
import { deriveWalletPDA, parseSOL, formatSOL } from '@/lib/sim-utils';

export async function POST(request: NextRequest) {
  try {
    const { from_sim, to_sim, amount } = await request.json();

    // Validate inputs
    if (!from_sim || !to_sim || !amount) {
      return NextResponse.json(
        { error: 'From SIM, to SIM, and amount are required' },
        { status: 400 }
      );
    }

    const amountLamports = parseSOL(amount);
    if (amountLamports <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Use hardcoded salt for demo
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    
    // Derive wallet PDAs
    const [fromWalletPda] = deriveWalletPDA(from_sim, salt, programId);
    const [toWalletPda] = deriveWalletPDA(to_sim, salt, programId);

    // Check if wallets exist
    const fromWalletAccount = await connection.getAccountInfo(fromWalletPda);
    const toWalletAccount = await connection.getAccountInfo(toWalletPda);

    if (!fromWalletAccount) {
      return NextResponse.json(
        { error: 'Sender wallet not found' },
        { status: 404 }
      );
    }

    if (!toWalletAccount) {
      return NextResponse.json(
        { error: 'Recipient wallet not found' },
        { status: 404 }
      );
    }

    // Check balance
    const fromBalance = await connection.getBalance(fromWalletPda);
    if (fromBalance < amountLamports) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll simulate the response
    // In production, you would call the actual program instruction
    const response = `Sent ${formatSOL(amountLamports)} SOL\nFrom: ${from_sim}\nTo: ${to_sim}\nStatus: ✅ Success`;

    return NextResponse.json({ 
      success: true, 
      message: response,
      fromWallet: fromWalletPda.toBase58(),
      toWallet: toWalletPda.toBase58(),
      amount: amountLamports
    });

  } catch (error) {
    console.error('Send funds error:', error);
    return NextResponse.json(
      { error: 'Failed to send funds' },
      { status: 500 }
    );
  }
} 