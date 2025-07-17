import { NextRequest, NextResponse } from 'next/server';
import { ChainManager, CrossChainTransfer, CrossChainResult } from '../../../lib/chains/chain-manager';

const chainManager = new ChainManager();

interface ConversionQuote {
  sourceAmount: string;
  targetAmount: string;
  exchangeRate: number;
  fees: {
    sourceChainFee: string;
    bridgeFee: string;
    targetChainFee: string;
    totalFee: string;
  };
  estimatedTime: number;
  slippageImpact: string;
}

// POST: Execute a cross-chain conversion (e.g., SOL -> DOT)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sim, pin, sourceChain, targetChain, amount, sourceToken, targetToken, slippageTolerance } = body;
    if (!sim || !pin || !sourceChain || !targetChain || !amount) {
      return NextResponse.json({ success: false, error: 'Missing required parameters: sim, pin, sourceChain, targetChain, amount' }, { status: 400 });
    }
    if (sourceChain === targetChain) {
      return NextResponse.json({ success: false, error: 'Source and target chains must be different' }, { status: 400 });
    }
    // Prepare transfer object
    const transfer: CrossChainTransfer = {
      sim,
      pin,
      sourceChain,
      targetChain,
      amount,
      sourceToken,
      targetToken,
      slippageTolerance,
    };
    // Execute conversion
    const result: CrossChainResult = await chainManager.crossChainTransfer(transfer);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// GET: Get a conversion quote (no transaction)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceChain = searchParams.get('sourceChain');
    const targetChain = searchParams.get('targetChain');
    const amount = searchParams.get('amount');
    const sourceToken = searchParams.get('sourceToken') || undefined;
    const targetToken = searchParams.get('targetToken') || undefined;
    const slippageTolerance = searchParams.get('slippageTolerance') ? parseFloat(searchParams.get('slippageTolerance')!) : 0.5;
    if (!sourceChain || !targetChain || !amount) {
      return NextResponse.json({ success: false, error: 'Missing required parameters: sourceChain, targetChain, amount' }, { status: 400 });
    }
    if (sourceChain === targetChain) {
      return NextResponse.json({ success: false, error: 'Source and target chains must be different' }, { status: 400 });
    }
    // Use the same calculation logic as ChainManager
    // We'll call a private method via a dummy transfer object
    const dummyTransfer: CrossChainTransfer = {
      sim: '',
      pin: '',
      sourceChain,
      targetChain,
      amount,
      sourceToken,
      targetToken,
      slippageTolerance,
    };
    // @ts-expect-error: Accessing private method for quote
    const conversionDetails = await chainManager.calculateConversion(dummyTransfer);
    const quote: ConversionQuote = {
      sourceAmount: amount,
      targetAmount: conversionDetails.targetAmount,
      exchangeRate: conversionDetails.exchangeRate,
      fees: conversionDetails.fees,
      estimatedTime: conversionDetails.estimatedTime,
      slippageImpact: ((parseFloat(conversionDetails.targetAmount) * slippageTolerance) / 100).toFixed(8),
    };
    return NextResponse.json({ success: true, data: quote });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
} 