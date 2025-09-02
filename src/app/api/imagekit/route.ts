import { config } from 'dotenv';
import ImageKit from 'imagekit';
import { NextResponse } from 'next/server';

config({ path: '.env.local' });

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

export async function GET() {
  // Check if all required environment variables are present
  if (!publicKey || !urlEndpoint || !privateKey) {
    return NextResponse.json(
      { 
        error: 'ImageKit configuration missing',
        missing: {
          publicKey: !publicKey,
          urlEndpoint: !urlEndpoint,
          privateKey: !privateKey
        }
      },
      { status: 500 }
    );
  }

  try {
    const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
    return NextResponse.json(imagekit.getAuthenticationParameters());
  } catch (error: any) {
    return NextResponse.json(
      { error: 'ImageKit initialization failed', message: error.message },
      { status: 500 }
    );
  }
}
