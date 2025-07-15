import { NextRequest, NextResponse } from 'next/server';
import { WalletDatabase } from '../../../lib/database';
import { AliasGenerator } from '../../../lib/alias-generator';
import { prisma } from '../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, newAlias } = await request.json();

    if (!walletAddress || !newAlias) {
      return NextResponse.json({ success: false, error: 'walletAddress and newAlias are required' }, { status: 400 });
    }

    // Validate alias format
    const validation = AliasGenerator.validateAliasFormat(newAlias);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Check if alias is available
    const isAvailable = await AliasGenerator.isAliasAvailable(newAlias);
    if (!isAvailable) {
      return NextResponse.json({ success: false, error: 'Alias is already taken' }, { status: 400 });
    }

    // Find wallet
    const wallet = await prisma.encryptedWallet.findUnique({ where: { walletAddress } });
    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
    }

    const oldAlias = wallet.alias || 'unknown';

    // Update wallet alias
    await prisma.encryptedWallet.update({
      where: { walletAddress },
              data: { alias: newAlias }
    });

    // Note: Alias history tracking removed - using audit logs instead

    return NextResponse.json({ success: true, message: 'Alias updated', oldAlias, newAlias });
  } catch (error: unknown) {
    console.error('Update alias failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
} 