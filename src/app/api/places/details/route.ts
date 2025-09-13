import { NextRequest, NextResponse } from 'next/server';
import { getPlaceFormattedAddress, getPlaceCoordinates } from '@/src/lib/google';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const place_id = searchParams.get('place_id');
    const language = searchParams.get('language') || 'en';
    const type = searchParams.get('type') || 'address'; // 'address' or 'coordinates'

    if (!place_id) {
      return NextResponse.json({ error: 'place_id parameter is required' }, { status: 400 });
    }

    if (type === 'coordinates') {
      const coordinates = await getPlaceCoordinates(place_id);
      return NextResponse.json({ coordinates });
    } else {
      const formatted_address = await getPlaceFormattedAddress(place_id, language as any);
      return NextResponse.json({ formatted_address });
    }
  } catch (error) {
    console.error('Error in place details API:', error);
    return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 500 });
  }
}
