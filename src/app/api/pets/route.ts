import { NextRequest, NextResponse } from 'next/server';
import { createPet, getUserPets } from '@/lib/actions/pets';

export async function GET() {
  try {
    const result = await getUserPets();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 500 }
      );
    }

    return NextResponse.json({ pets: result.pets });
  } catch (error) {
    console.error('Get pets error:', error);
    return NextResponse.json(
      { error: 'Failed to get pets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const petData = await request.json();
    const result = await createPet(petData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      petId: result.petId,
      message: 'Pet created successfully' 
    });
  } catch (error) {
    console.error('Create pet error:', error);
    return NextResponse.json(
      { error: 'Failed to create pet' },
      { status: 500 }
    );
  }
}