import { NextResponse } from 'next/server';
import { getGenders } from '@/lib/actions/pets';

export async function GET() {
  try {
    const result = await getGenders();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ genders: result.genders });
  } catch (error) {
    console.error('Get genders error:', error);
    return NextResponse.json(
      { error: 'Failed to get genders' },
      { status: 500 }
    );
  }
}
