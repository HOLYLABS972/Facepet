# Vercel Deployment Guide - Facepet

## 🚨 Common Issues Between Local vs Vercel

### 1. Environment Variables Missing
The most common cause of 404 errors on Vercel is missing environment variables.

#### Required Environment Variables for Vercel:

```env
# Database (CRITICAL - App won't work without this)
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication (CRITICAL)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.vercel.app

# Email Service (Required for user registration)
RESEND_TOKEN=re_your_resend_api_key_here
EMAIL_FROM=Facepet <noreply@yourdomain.com>

# Application URLs (CRITICAL)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_PROD_API_ENDPOINT=https://your-domain.vercel.app

# ImageKit (Required for image uploads)
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key

# Google Maps (Required for location features)
GOOGLE_API_KEY=your_google_maps_api_key

# Upstash Redis & QStash (Required for workflows)
UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
```

### 2. Next.js Configuration Issues

Your `next.config.ts` has some settings that might cause issues:

```typescript
// These settings might cause build issues on Vercel
typescript: {
  ignoreBuildErrors: true  // ⚠️ This hides TypeScript errors
},
eslint: {
  ignoreDuringBuilds: true  // ⚠️ This hides ESLint errors
}
```

### 3. Middleware Configuration

Your middleware is complex and might cause routing issues. The middleware handles:
- Authentication
- Email verification
- Internationalization (i18n)
- Admin routes

### 4. Database Connection

Your app uses Neon Database with Drizzle ORM. Make sure:
- Database URL is correct
- Database is accessible from Vercel's IP ranges
- All migrations have been run

## 🔧 Step-by-Step Fix

### Step 1: Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add ALL the environment variables listed above
5. Make sure to set them for Production, Preview, and Development

### Step 2: Update Next.js Config (Optional)

Consider removing the error-ignoring settings for better debugging:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: ''
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60
  },
  // Remove these lines for better error reporting:
  // typescript: { ignoreBuildErrors: true },
  // eslint: { ignoreDuringBuilds: true },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  }
};
```

### Step 3: Check Build Logs

1. Go to Vercel dashboard
2. Click on your latest deployment
3. Check the "Build Logs" tab
4. Look for any errors or warnings

### Step 4: Test Database Connection

Create a simple API route to test database connection:

```typescript
// src/app/api/test-db/route.ts
import { db } from '@/utils/database/drizzle';

export async function GET() {
  try {
    // Simple query to test connection
    const result = await db.execute('SELECT 1 as test');
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0
      }
    }, { status: 500 });
  }
}
```

### Step 5: Check Function Timeouts

Your app uses several external services that might timeout:
- Database queries
- Email sending
- Image uploads
- Google Maps API

The `vercel.json` file I created sets a 30-second timeout for API routes.

## 🐛 Debugging Steps

### 1. Check Vercel Function Logs
- Go to Vercel dashboard
- Click on Functions tab
- Check for any error logs

### 2. Test Individual Components
Create test API routes for each service:
- `/api/test-db` - Database connection
- `/api/test-email` - Email service
- `/api/test-imagekit` - Image upload
- `/api/test-auth` - Authentication

### 3. Check Network Tab
- Open browser dev tools
- Go to Network tab
- Look for failed requests
- Check response status codes

## 🚀 Quick Fix Checklist

- [ ] All environment variables set in Vercel
- [ ] Database URL is correct and accessible
- [ ] NEXTAUTH_URL matches your Vercel domain
- [ ] NEXT_PUBLIC_APP_URL matches your Vercel domain
- [ ] All external service API keys are valid
- [ ] Database migrations have been run
- [ ] Build completes without errors
- [ ] No TypeScript or ESLint errors

## 📞 Common Error Solutions

### 404 NOT_FOUND
- Usually missing environment variables
- Check that all required env vars are set
- Verify NEXTAUTH_URL and NEXT_PUBLIC_APP_URL

### Database Connection Errors
- Verify DATABASE_URL format
- Check database is accessible from Vercel
- Ensure database has proper permissions

### Authentication Errors
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your domain
- Ensure all auth-related env vars are present

### Image Upload Errors
- Verify ImageKit credentials
- Check NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
- Ensure IMAGEKIT_PRIVATE_KEY is set

## 🔍 Still Having Issues?

1. Check Vercel build logs for specific errors
2. Test each API endpoint individually
3. Verify all external services are working
4. Check browser console for client-side errors
5. Ensure all dependencies are properly installed

The most likely cause of your 404 error is missing environment variables, particularly:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
