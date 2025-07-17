import { NextRequest, NextResponse } from 'next/server';
import { WalletDatabase } from '../../../lib/database';
import { PhoneEncryption } from '../../../lib/encryption';
import { ChainManager } from '../../../lib/chains/chain-manager';

const chainManager = new ChainManager();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, chain = 'solana', ...params } = body;

    switch (action) {
      case 'wallet-exists':
        return await handleWalletExists(params);
      
      case 'wallet-info':
        return await handleWalletInfo(params, chain);
      
      case 'wallet-balance':
        return await handleWalletBalance(params, chain);
      
      case 'health-check':
        return await handleHealthCheck(chain);
      
      case 'initialize-wallet':
        return await handleInitializeWallet(params, chain);
      
      case 'verify-pin':
        return await handleVerifyPin(params, chain);
      
      case 'set-alias':
        return await handleSetAlias(params, chain);
      
      case 'send-funds':
        return await handleSendFunds(params, chain);
      
      case 'deposit-funds':
        return await handleDepositFunds(params, chain);
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Relay API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleWalletExists(params: { sim?: string }) {
  try {
    const { sim } = params;
    if (!sim) {
      return NextResponse.json(
        { success: false, error: 'SIM number required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!PhoneEncryption.validatePhoneNumber(sim)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if wallet exists in database
    const wallet = await WalletDatabase.findWalletBySim(sim);
    const exists = wallet !== null;

    return NextResponse.json({
      success: true,
      data: { exists }
    });

  } catch (error: unknown) {
    console.error('Wallet exists check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleWalletInfo(params: { sim?: string }, chain: string) {
  const { sim } = params;
  if (!sim) {
    return NextResponse.json(
      { success: false, error: 'SIM number required' },
      { status: 400 }
    );
  }
  try {
    const walletInfo = await chainManager.getWalletInfo(chain, sim);
    return NextResponse.json({ success: true, data: walletInfo });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleWalletBalance(params: { sim?: string }, chain: string) {
  const { sim } = params;
  if (!sim) {
    return NextResponse.json(
      { success: false, error: 'SIM number required' },
      { status: 400 }
    );
  }
  try {
    const balance = await chainManager.executeOperation({
      type: 'checkBalance',
      targetChain: chain,
      sim,
      pin: '',
      params: {}
    });
    return NextResponse.json({ success: true, data: { balance } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleHealthCheck(chain: string) {
  try {
    const connected = await chainManager.testChainConnection(chain);
    return NextResponse.json({ success: true, data: { connected, chain } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleInitializeWallet(params: { sim?: string, pin?: string }, chain: string) {
  const { sim, pin } = params;
  if (!sim || !pin) {
    return NextResponse.json(
      { success: false, error: 'SIM number and PIN required' },
      { status: 400 }
    );
  }
  try {
    const signature = await chainManager.executeOperation({
      type: 'initializeWallet',
      targetChain: chain,
      sim,
      pin,
      params: {}
    });
    return NextResponse.json({ success: true, data: { signature } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleVerifyPin(params: { sim?: string, pin?: string }, chain: string) {
  const { sim, pin } = params;
  if (!sim || !pin) {
    return NextResponse.json(
      { success: false, error: 'SIM number and PIN required' },
      { status: 400 }
    );
  }
  try {
    const isValid = await chainManager.executeOperation({
      type: 'validatePin',
      targetChain: chain,
      sim,
      pin,
      params: {}
    });
    return NextResponse.json({ success: true, data: { isValid } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleSetAlias(params: { sim?: string, alias?: string, pin?: string }, chain: string) {
  const { sim, alias, pin } = params;
  if (!sim || !alias || !pin) {
    return NextResponse.json(
      { success: false, error: 'SIM number, alias, and PIN required' },
      { status: 400 }
    );
  }
  try {
    const result = await chainManager.executeOperation({
      type: 'setAlias',
      targetChain: chain,
      sim,
      pin,
      params: { alias }
    });
    return NextResponse.json({ success: true, data: { result } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleSendFunds(params: { fromSim?: string, toSim?: string, amount?: number, pin?: string }, chain: string) {
  const { fromSim, toSim, amount, pin } = params;
  if (!fromSim || !toSim || !amount || !pin) {
    return NextResponse.json(
      { success: false, error: 'All parameters required' },
      { status: 400 }
    );
  }
  try {
    const tx = await chainManager.executeOperation({
      type: 'sendFunds',
      targetChain: chain,
      sim: fromSim,
      pin,
      params: { from: fromSim, to: toSim, amount: amount.toString() }
    });
    return NextResponse.json({ success: true, data: { tx } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleDepositFunds(params: { sim?: string, amount?: number, pin?: string }, chain: string) {
  const { sim, amount, pin } = params;
  if (!sim || !amount || !pin) {
    return NextResponse.json(
      { success: false, error: 'SIM number, amount, and PIN required' },
      { status: 400 }
    );
  }
  try {
    // For deposit, we treat as sendFunds from a relayer/admin to the user
    const tx = await chainManager.executeOperation({
      type: 'sendFunds',
      targetChain: chain,
      sim,
      pin,
      params: { from: 'relayer', to: sim, amount: amount.toString() }
    });
    return NextResponse.json({ success: true, data: { tx } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

 