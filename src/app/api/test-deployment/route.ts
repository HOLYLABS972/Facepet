import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test environment variables
    const envCheck = {
      // Critical environment variables
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      
      // Email service
      RESEND_TOKEN: !!process.env.RESEND_TOKEN,
      
      // ImageKit
      NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: !!process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
      IMAGEKIT_PRIVATE_KEY: !!process.env.IMAGEKIT_PRIVATE_KEY,
      
      // Google Maps
      GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
      
      // Upstash
      UPSTASH_REDIS_URL: !!process.env.UPSTASH_REDIS_URL,
      UPSTASH_REDIS_TOKEN: !!process.env.UPSTASH_REDIS_TOKEN,
      QSTASH_URL: !!process.env.QSTASH_URL,
      QSTASH_TOKEN: !!process.env.QSTASH_TOKEN,
    };

    // Count missing variables
    const missingVars = Object.entries(envCheck)
      .filter(([_, exists]) => !exists)
      .map(([key, _]) => key);

    // Test database connection
    let dbTest = { success: false, error: null };
    try {
      const { db } = await import('@/utils/database/drizzle');
      await db.execute('SELECT 1 as test');
      dbTest = { success: true, error: null };
    } catch (error: any) {
      dbTest = { success: false, error: error.message };
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      deployment: {
        platform: 'vercel',
        region: process.env.VERCEL_REGION || 'unknown',
        url: process.env.VERCEL_URL || 'unknown'
      },
      environmentVariables: envCheck,
      missingVariables: missingVars,
      databaseTest: dbTest,
      criticalIssues: missingVars.filter(varName => 
        ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'NEXT_PUBLIC_APP_URL'].includes(varName)
      ),
      recommendations: missingVars.length > 0 ? [
        'Set missing environment variables in Vercel dashboard',
        'Go to Settings → Environment Variables',
        'Add all variables from .env.example',
        'Redeploy after adding variables'
      ] : ['All environment variables are set correctly']
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
