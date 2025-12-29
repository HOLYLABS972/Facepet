# Mobile Browser Crash Fix

## Root Cause
The app was crashing on mobile browsers due to unsafe `window` and `localStorage` access that wasn't properly guarded.

## Fixes Applied

### 1. Fixed `window.innerWidth` access in `src/app/[locale]/page.tsx`
- Added proper `typeof window !== 'undefined'` checks
- Fixed event listener cleanup

### 2. Fixed `localStorage` access in `src/contexts/AuthContext.tsx`
- Line 261: Added window check before accessing localStorage

### 3. Added cache-busting headers
- Middleware now sends `no-cache` headers to prevent mobile browsers from using cached broken code

### 4. Added unique build IDs
- Each build gets a timestamp-based ID to prevent Server Action cache mismatches

## Why Mobile Browsers Crashed

1. **Unsafe window access**: Code accessed `window.innerWidth` without checking if `window` exists
2. **localStorage without guards**: `localStorage.getItem()` called during SSR/initial render
3. **Server Action cache mismatch**: Mobile browsers cached old JavaScript with old Server Action IDs

## Testing

After deploying, test on mobile:
1. Clear browser cache completely
2. Hard refresh (close and reopen browser)
3. Or use incognito/private mode

The app should now load properly on mobile browsers.

