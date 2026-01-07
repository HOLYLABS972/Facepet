import { NextRequest, NextResponse } from 'next/server';
import { createContactSubmission } from '@/src/lib/supabase/database/contact';
import { z } from 'zod';

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = contactSchema.parse(body);
    
    // Create the contact submission
    const submission = await createContactSubmission(validatedData);
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Contact form submitted successfully',
        id: submission.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
