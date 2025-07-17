import { NextRequest, NextResponse } from 'next/server';
import { HyperbridgeService, IdentityAggregationConfig } from '../../../../lib/hyperbridge/hyperbridge-service';

const hyperbridgeService = new HyperbridgeService({
  apiKey: process.env.HYPERBRIDGE_API_KEY || 'mock-key',
  network: (process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'),
  supportedChains: ['ethereum', 'polkadot', 'solana', 'arbitrum', 'base', 'optimism']
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chains, userAddress, identityData, includeBalances, includeTransactions } = body;
    if (!chains || !userAddress || !identityData) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: chains, userAddress, identityData' },
        { status: 400 }
      );
    }
    const result = await hyperbridgeService.aggregateIdentity({
      chains,
      userAddress,
      identityData,
      includeBalances,
      includeTransactions
    } as IdentityAggregationConfig);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
