import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the mobileconfig file from public folder
    const filePath = join(process.cwd(), 'public', 'Chapiz.mobileconfig');
    const fileContents = await readFile(filePath);

    // Return with correct content-type for mobileconfig files
    // macOS/iOS requires application/x-apple-aspen-config MIME type
    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': 'application/x-apple-aspen-config',
        'Content-Disposition': 'attachment; filename="Chapiz.mobileconfig"',
        'Content-Length': fileContents.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error serving mobileconfig file:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}

