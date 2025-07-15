import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'wallet-exists':
        return await handleWalletExists(params);
      
      case 'wallet-info':
        return await handleWalletInfo(params);
      
      case 'wallet-balance':
        return await handleWalletBalance(params);
      
      case 'health-check':
        return await handleHealthCheck();
      
      case 'initialize-wallet':
        return await handleInitializeWallet(params);
      
      case 'verify-pin':
        return await handleVerifyPin(params);
      
      case 'set-alias':
        return await handleSetAlias(params);
      
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

    // Simple validation
    if (sim.length < 7 || sim.length > 15) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Simulate wallet existence check
    const exists = sim.length > 10; // Simple logic for demo

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

async function handleWalletInfo(params: { sim?: string }) {
  try {
    const { sim } = params;
    if (!sim) {
      return NextResponse.json(
        { success: false, error: 'SIM number required' },
        { status: 400 }
      );
    }

    // Simulate wallet info
    const simHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sim));
    const hashArray = new Uint8Array(simHash);
    const balance = (hashArray[0] * 256 + hashArray[1]) / 100;

    return NextResponse.json({
      success: true,
      data: {
        sim,
        balance,
        exists: true,
        message: 'Wallet info retrieved (stub mode)'
      }
    });

  } catch (error: unknown) {
    console.error('Wallet info failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleWalletBalance(params: { sim?: string }) {
  try {
    const { sim } = params;
    if (!sim) {
      return NextResponse.json(
        { success: false, error: 'SIM number required' },
        { status: 400 }
      );
    }

    // Simulate balance check
    const simHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sim));
    const hashArray = new Uint8Array(simHash);
    const balance = (hashArray[0] * 256 + hashArray[1]) / 100;

    return NextResponse.json({
      success: true,
      data: { balance, currency: 'SOL' }
    });

  } catch (error: unknown) {
    console.error('Wallet balance failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleHealthCheck() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        programId: 'DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r',
        message: 'Health check passed (stub mode)'
      }
    });

  } catch (error: unknown) {
    console.error('Health check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleInitializeWallet(params: { sim?: string, pin?: string }) {
  try {
    const { sim, pin } = params;
    if (!sim || !pin) {
      return NextResponse.json(
        { success: false, error: 'SIM number and PIN required' },
        { status: 400 }
      );
    }

    // Simple validation
    if (sim.length < 7 || sim.length > 15) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (!/^[0-9]{6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Simulate wallet creation
    const simBytes = new TextEncoder().encode(sim);
    const pinBytes = new TextEncoder().encode(pin);
    const combined = new Uint8Array([...simBytes, ...pinBytes]);
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = new Uint8Array(hashBuffer);
    const walletAddress = `wallet_${Array.from(hashArray.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}`;

    return NextResponse.json({
      success: true,
      data: {
        walletAddress,
        sim,
        message: 'Wallet initialized successfully (stub mode)'
      }
    });

  } catch (error: unknown) {
    console.error('Initialize wallet failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleVerifyPin(params: { sim?: string, pin?: string }) {
  try {
    const { sim, pin } = params;
    if (!sim || !pin) {
      return NextResponse.json(
        { success: false, error: 'SIM number and PIN required' },
        { status: 400 }
      );
    }

    // Simple PIN verification (always true for stub)
    return NextResponse.json({
      success: true,
      data: { verified: true, message: 'PIN verified successfully (stub mode)' }
    });

  } catch (error: unknown) {
    console.error('Verify PIN failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleSetAlias(params: { sim?: string, alias?: string }) {
  try {
    const { sim, alias } = params;
    if (!sim || !alias) {
      return NextResponse.json(
        { success: false, error: 'SIM number and alias required' },
        { status: 400 }
      );
    }

    // Simple validation
    if (alias.length < 3 || alias.length > 32) {
      return NextResponse.json(
        { success: false, error: 'Alias must be between 3 and 32 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
      return NextResponse.json(
        { success: false, error: 'Alias can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sim,
        alias,
        message: 'Alias set successfully (stub mode)'
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

 