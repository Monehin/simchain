import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      ENCRYPTION_SECRET_KEY: process.env.ENCRYPTION_SECRET_KEY ? 'SET' : 'NOT_SET',
      WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY ? 'SET' : 'NOT_SET',
      SOLANA_CLUSTER_URL: process.env.SOLANA_CLUSTER_URL,
      PROGRAM_ID: process.env.PROGRAM_ID,
      ADMIN_API_KEY: process.env.ADMIN_API_KEY ? 'SET' : 'NOT_SET',
    };

    return NextResponse.json({
      success: true,
      data: {
        environmentVariables: envVars,
        message: 'Environment variables check completed'
      }
    });
    
  } catch (error: unknown) {
    console.error('Environment test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 