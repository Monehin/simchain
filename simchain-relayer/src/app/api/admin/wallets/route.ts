import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return sample data
    // In production, you would scan the blockchain for all wallet accounts
    const wallets = [
      {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        alias: 'alice_wallet',
        balance: 1.25,
        simHash: '0x1234...5678'
      },
      {
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        alias: 'bob_wallet',
        balance: 0.75,
        simHash: '0x8765...4321'
      },
      {
        address: '3xWe8dN1m8qL1TcNqUqXounEk5kqexULcm1biLp6Z5K5',
        alias: 'carol_wallet',
        balance: 2.10,
        simHash: '0xabcd...efgh'
      },
      {
        address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
        alias: 'dave_wallet',
        balance: 0.50,
        simHash: '0x9876...5432'
      }
    ];

    return NextResponse.json({ 
      success: true, 
      wallets,
      total: wallets.length
    });

  } catch (error: unknown) {
    console.error('Error fetching wallets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wallets';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 