import { NextRequest, NextResponse } from 'next/server';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SimchainClient } from '../../../lib/simchain-client';
import { PinValidator } from '../../../lib/validation';
import { ErrorLogger } from '../../../lib/audit-log';
import { WalletDatabase } from '../../../lib/database';
import { PROGRAM_ID } from '@/config/programId';

export async function POST(request: NextRequest) {
  try {
    const { sim, pin, alias, country = 'RW' } = await request.json();
    
    if (!sim || !pin || !alias) {
      return NextResponse.json(
        { success: false, error: 'SIM number, PIN, and alias are required' },
        { status: 400 }
      );
    }
    
    if (!PinValidator.validatePin(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      );
    }

    if (alias.length > 32 || alias.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Alias must be between 1 and 32 characters' },
        { status: 400 }
      );
    }

    // Initialize the real blockchain client
    const programId = new PublicKey(PROGRAM_ID);
    
    // Create a wallet keypair from the private key
    const privateKeyString = process.env.WALLET_PRIVATE_KEY;
    if (!privateKeyString) {
      return NextResponse.json(
        { success: false, error: 'Wallet private key not configured' },
        { status: 500 }
      );
    }
    
    const privateKeyBytes = Uint8Array.from(JSON.parse(privateKeyString));
    const wallet = Keypair.fromSecretKey(privateKeyBytes);
    
    const client = new SimchainClient({
      connection: { rpcEndpoint: process.env.SOLANA_CLUSTER_URL || 'http://127.0.0.1:8899' },
      programId,
      wallet,
      commitment: 'confirmed'
    });

    let result: string;
    try {
      result = await client.setAlias({ sim, alias, pin, country });
    } catch (error: unknown) {
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Simulation failed')) {
        if (errorMessage.includes('already in use')) {
          errorMessage = 'Alias already in use.';
        } else {
          errorMessage = 'Failed to set alias. Please try again or contact support.';
        }
      }
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }
    
    // Store alias in database
    try {
      await WalletDatabase.updateWalletAlias(sim, alias);
    } catch (dbError) {
      console.error('Failed to store alias in database:', dbError);
      // Log the database error
      await ErrorLogger.logAliasSetError(sim, alias, dbError instanceof Error ? dbError.message : 'Database error', 'DB_ERROR', {
        signature: result
      });
      // Don't fail the request if database storage fails
      // The blockchain transaction was successful
    }

    // Alias set successfully - no need to log success

    let aliasResult: string = alias;
    try {
      const walletRecord = await WalletDatabase.findWalletBySim(sim);
      if (walletRecord) {
        aliasResult = walletRecord.alias || 'unknown';
      }
    } catch {}
    return NextResponse.json({
      success: true,
      data: {
        message: 'Alias set successfully',
        alias: aliasResult,
        signature: result
      }
    });
    
  } catch (error: unknown) {
    console.error('Set alias failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 