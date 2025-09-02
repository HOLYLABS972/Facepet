# Logout Redirect Fix

## Issue
When users logged out, they were being redirected to the old auth sign-in page (`/auth/sign-in`) instead of the landing page.

## Root Cause
The logout functions in the application were redirecting to `/auth` instead of the landing page (`/`).

## Files Fixed

### 1. `src/components/layout/Navbar.tsx`
**Before:**
```typescript
const handleLogout = async () => {
  try {
    console.log('Firebase logout...', { user });
    await signOut();
    console.log('Firebase logout completed, redirecting...');
    window.location.href = '/auth';  // ❌ Wrong redirect
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/auth';  // ❌ Wrong redirect
  }
};
```

**After:**
```typescript
const handleLogout = async () => {
  try {
    console.log('Firebase logout...', { user });
    await signOut();
    console.log('Firebase logout completed, redirecting to landing page...');
    window.location.href = '/';  // ✅ Correct redirect to landing page
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/';  // ✅ Correct redirect to landing page
  }
};
```

### 2. `src/components/WelcomeGetStartedPage.tsx`
**Before:**
```typescript
<Button
  onClick={() =>
    user
      ? signOut()  // ❌ No redirect after logout
      : router.push(`/auth`)
  }
  className="text-primary p-0 font-bold underline hover:bg-transparent"
  variant={'ghost'}
>
  {user ? t('signOutLink') : t('signInLink')}
</Button>
```

**After:**
```typescript
<Button
  onClick={async () => {
    if (user) {
      await signOut();
      router.push('/');  // ✅ Redirect to landing page after logout
    } else {
      router.push(`/auth`);
    }
  }}
  className="text-primary p-0 font-bold underline hover:bg-transparent"
  variant={'ghost'}
>
  {user ? t('signOutLink') : t('signInLink')}
</Button>
```

## Result
✅ **Fixed**: Users now properly redirect to the landing page (`/`) when they log out
✅ **Build**: Application builds successfully without errors
✅ **Consistency**: All logout functions now redirect to the same landing page

## Testing
- Logout from navbar dropdown → redirects to landing page
- Logout from welcome page → redirects to landing page
- Build process completes successfully
