import { NextRequest, NextResponse } from 'next/server';
import { HyperbridgeService, CrossChainQuery } from '../../../../lib/hyperbridge/hyperbridge-service';

const hyperbridgeService = new HyperbridgeService({
  apiKey: process.env.HYPERBRIDGE_API_KEY || 'mock-key',
  network: (process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'),
  supportedChains: ['ethereum', 'polkadot', 'solana', 'arbitrum', 'base', 'optimism']
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceChain, targetChain, storageKey, blockNumber, params } = body;

    if (!sourceChain || !targetChain || !storageKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: sourceChain, targetChain, storageKey' },
        { status: 400 }
      );
    }

    const result = await hyperbridgeService.queryCrossChainStorage({
      sourceChain,
      targetChain,
      storageKey,
      blockNumber,
      params
    } as CrossChainQuery);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
