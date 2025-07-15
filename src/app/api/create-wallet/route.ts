import { NextRequest, NextResponse } from 'next/server';
import { connection, program, programId } from '@/lib/solana';
import { deriveWalletPDA, pinToBytes, validatePin } from '@/lib/sim-utils';
import { SimchainClient } from '../../../utils/simchainClient';

export async function POST(request: NextRequest) {
  try {
    const { sim, pin } = await request.json();

    // Validate inputs
    if (!sim || !pin) {
      return NextResponse.json(
        { error: 'SIM number and PIN are required' },
        { status: 400 }
      );
    }

    if (!validatePin(pin)) {
      return NextResponse.json(
        { error: 'PIN must be at least 8 characters with letters and numbers' },
        { status: 400 }
      );
    }

    // Use hardcoded salt for demo
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    
    // Derive wallet PDA
    const [walletPda] = deriveWalletPDA(sim, salt, programId);
    
    // Hash PIN
    const pinHash = pinToBytes(pin);

    // Check if wallet already exists
    const existingWallet = await connection.getAccountInfo(walletPda);
    if (existingWallet) {
      return NextResponse.json(
        { error: 'Wallet already exists for this SIM number' },
        { status: 409 }
      );
    }

    // For demo purposes, we'll simulate the response
    // In production, you would call the actual program instruction
    const response = `Wallet created ✅\nSIM: ${sim}\nAddress: ${walletPda.toBase58().slice(0, 8)}...`;

    return NextResponse.json({ 
      success: true, 
      message: response,
      wallet: walletPda.toBase58()
    });

  } catch (error) {
    console.error('Create wallet error:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    );
  }
} 