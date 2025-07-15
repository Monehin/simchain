import { NextRequest, NextResponse } from 'next/server';
import { WalletDatabase } from '../../../lib/database';
import { PhoneEncryption } from '../../../lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const { sim, country = 'RW' } = await request.json();
    
    if (!sim) {
      return NextResponse.json(
        { success: false, error: 'SIM number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!PhoneEncryption.validatePhoneNumber(sim)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Please use international format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    // Check if phone number is registered
    const isRegistered = await WalletDatabase.isPhoneNumberRegistered(sim);
    
    if (isRegistered) {
      // Get wallet info for registered users
      const walletRecord = await WalletDatabase.findWalletBySim(sim);
      return NextResponse.json({
        success: true,
        data: {
          exists: true,
          walletAddress: walletRecord?.walletAddress,
          alias: walletRecord?.alias || 'unknown'
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          exists: false
        }
      });
    }
    
  } catch (error: unknown) {
    console.error('Wallet exists check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 