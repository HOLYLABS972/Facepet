import { NextRequest, NextResponse } from 'next/server';
import { autocomplete } from '@/src/lib/google';

// Mark this route as dynamic since it depends on query parameters
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get('input');
    const language = searchParams.get('language') || 'en';

    if (!input) {
      return NextResponse.json({ error: 'Input parameter is required' }, { status: 400 });
    }

    const predictions = await autocomplete(input, language as any);
    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Error in autocomplete API:', error);
    return NextResponse.json({ error: 'Failed to fetch autocomplete results' }, { status: 500 });
  }
}
