import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

/**
 * POST handler for the root route
 * This handles POST requests that might come from forms, prefetch, or other sources
 */
export async function POST(request: NextRequest) {
  try {
    // Log the POST request for debugging
    console.log('POST request received at root:', {
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Try to parse the body if present
    let body;
    try {
      body = await request.json();
      console.log('POST body:', body);
    } catch (e) {
      // Body might not be JSON, that's okay
      console.log('POST request has no JSON body');
    }

    // Return a simple success response
    return NextResponse.json(
      {
        success: true,
        message: 'POST request received',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error handling POST request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
