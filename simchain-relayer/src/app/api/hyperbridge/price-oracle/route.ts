import { NextRequest, NextResponse } from 'next/server';
import { HyperbridgeService, PriceFeedConfig } from '../../../../lib/hyperbridge/hyperbridge-service';

const hyperbridgeService = new HyperbridgeService({
  apiKey: process.env.HYPERBRIDGE_API_KEY || 'mock-key',
  network: (process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'),
  supportedChains: ['ethereum', 'polkadot', 'solana', 'arbitrum', 'base', 'optimism']
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (action === 'create') {
      const { sourceDEX, targetChains, updateInterval, tokenPair } = params;
      if (!sourceDEX || !targetChains || !updateInterval || !tokenPair) {
        return NextResponse.json(
          { success: false, error: 'Missing required parameters for price oracle creation.' },
          { status: 400 }
        );
      }
      const oracle = await hyperbridgeService.createPriceOracle({
        sourceDEX,
        targetChains,
        updateInterval,
        tokenPair
      } as PriceFeedConfig);
      return NextResponse.json({ success: true, data: oracle });
    } else if (action === 'get') {
      const { oracleId } = params;
      if (!oracleId) {
        return NextResponse.json(
          { success: false, error: 'Missing oracleId for fetching price oracle.' },
          { status: 400 }
        );
      }
      const oracle = await hyperbridgeService.getPriceOracle(oracleId);
      return NextResponse.json({ success: true, data: oracle });
    } else {
      return NextResponse.json(
        { success: false, error: 'Unknown action. Use "create" or "get".' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
