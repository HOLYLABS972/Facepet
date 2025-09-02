import { NextRequest, NextResponse } from 'next/server';
import { getPetById, updatePet, deletePet } from '@/lib/actions/pets';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getPetById(id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Pet not found' ? 404 : result.error === 'Unauthorized' ? 401 : 500 }
      );
    }

    return NextResponse.json({ pet: result.pet });
  } catch (error) {
    console.error('Get pet error:', error);
    return NextResponse.json(
      { error: 'Failed to get pet' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const petData = await request.json();
    const result = await updatePet(id, petData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Pet not found' ? 404 : result.error === 'Unauthorized' ? 401 : 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Pet updated successfully' 
    });
  } catch (error) {
    console.error('Update pet error:', error);
    return NextResponse.json(
      { error: 'Failed to update pet' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deletePet(id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Pet not found' ? 404 : result.error === 'Unauthorized' ? 401 : 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Pet deleted successfully' 
    });
  } catch (error) {
    console.error('Delete pet error:', error);
    return NextResponse.json(
      { error: 'Failed to delete pet' },
      { status: 500 }
    );
  }
}
