import { NextRequest, NextResponse } from 'next/server';
import { ErrorLogger } from '../../../lib/audit-log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alias = searchParams.get('alias');
    const limit = parseInt(searchParams.get('limit') || '50');

    let errors: unknown[] = [];

    if (alias) {
      errors = await ErrorLogger.getAliasErrors(alias, limit);
    } else {
      // Get system error stats
      const stats = await ErrorLogger.getErrorStats();
      return NextResponse.json({
        success: true,
        data: {
          stats,
          recentErrors: stats.recentErrors
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        errors,
        count: errors.length
      }
    });

  } catch (error: unknown) {
    console.error('Failed to get error logs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 