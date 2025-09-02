import { NextRequest, NextResponse } from 'next/server';
import { getPetsForUser } from '@/src/lib/firebase/queries/pets';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const locale = searchParams.get('locale') || 'en';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const pets = await getPetsForUser(userId, locale);

    return NextResponse.json({
      success: true,
      pets
    });

  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pets' },
      { status: 500 }
    );
  }
}
