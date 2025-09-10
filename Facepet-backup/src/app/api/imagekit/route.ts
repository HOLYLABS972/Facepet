import { config } from 'dotenv';
import ImageKit from 'imagekit';
import { NextResponse } from 'next/server';

config({ path: '.env.local' });

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY!;

const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });

export async function GET() {
  return NextResponse.json(imagekit.getAuthenticationParameters());
}
