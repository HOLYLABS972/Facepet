import { NextResponse } from 'next/server';
import { getBreeds } from '@/lib/actions/pets';

export async function GET() {
  try {
    const result = await getBreeds();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ breeds: result.breeds });
  } catch (error) {
    console.error('Get breeds error:', error);
    return NextResponse.json(
      { error: 'Failed to get breeds' },
      { status: 500 }
    );
  }
}
