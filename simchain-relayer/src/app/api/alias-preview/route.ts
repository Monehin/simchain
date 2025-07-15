import { NextRequest, NextResponse } from 'next/server';
import { AliasGenerator } from '../../../lib/alias-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '5');
    const maxCount = Math.min(count, 20); // Limit to 20 for performance

    // Generate preview aliases
    const previewAliases = AliasGenerator.generatePreviewAliases(maxCount);

    // Get alias statistics
    const stats = await AliasGenerator.getAliasStats();

    return NextResponse.json({
      success: true,
      data: {
        previewAliases,
        stats,
        generated: maxCount
      }
    });

  } catch (error: unknown) {
    console.error('Failed to generate alias preview:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 