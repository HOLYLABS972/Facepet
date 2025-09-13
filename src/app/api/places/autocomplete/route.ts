import { NextRequest, NextResponse } from 'next/server';
import { autocomplete } from '@/src/lib/google';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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
