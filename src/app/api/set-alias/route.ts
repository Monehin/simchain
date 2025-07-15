import { NextRequest, NextResponse } from 'next/server';
import { connection, programId } from '@/lib/solana';
import { deriveWalletPDA, deriveAliasIndexPDA } from '@/lib/sim-utils';
import { SimchainClient } from '../../../utils/simchainClient';

export async function POST(request: NextRequest) {
  try {
    const { sim, alias } = await request.json();

    // Validate inputs
    if (!sim || !alias) {
      return NextResponse.json(
        { error: 'SIM number and alias are required' },
        { status: 400 }
      );
    }

    if (alias.length > 32) {
      return NextResponse.json(
        { error: 'Alias must be 32 characters or less' },
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

    // Convert alias to bytes
    const aliasBytes = new TextEncoder().encode(alias);
    
    // Derive alias index PDA
    const [aliasIndexPda] = deriveAliasIndexPDA(aliasBytes, programId);

    // Check if alias is already taken
    const existingAliasIndex = await connection.getAccountInfo(aliasIndexPda);
    if (existingAliasIndex) {
      return NextResponse.json(
        { error: 'Alias is already taken' },
        { status: 409 }
      );
    }

    // For demo purposes, we'll simulate the response
    // In production, you would call the actual program instruction
    const response = `Alias set ✅\nSIM: ${sim}\nAlias: ${alias}`;

    return NextResponse.json({ 
      success: true, 
      message: response,
      wallet: walletPda.toBase58(),
      alias: alias
    });

  } catch (error) {
    console.error('Set alias error:', error);
    return NextResponse.json(
      { error: 'Failed to set alias' },
      { status: 500 }
    );
  }
} 