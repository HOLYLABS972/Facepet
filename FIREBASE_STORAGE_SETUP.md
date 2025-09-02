# Firebase Storage Setup Guide

## Issue: Image Upload Not Working in Settings

The image upload in your settings page isn't working because Firebase Storage rules need to be configured.

## Quick Fix Steps:

### 1. Deploy Storage Rules
Run this command in your terminal:
```bash
./scripts/deploy-storage-rules.sh
```

### 2. If you don't have Firebase CLI installed:
```bash
npm install -g firebase-tools
firebase login
./scripts/deploy-storage-rules.sh
```

### 3. Manual Setup (Alternative)
If the script doesn't work, you can manually set up the rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `facepet-48b13`
3. Go to **Storage** in the left sidebar
4. Click on **Rules** tab
5. Replace the existing rules with the content from `firebase-storage.rules`
6. Click **Publish**

## Storage Rules Explanation:

The rules I created allow:
- ✅ **Profile images**: Users can upload to `/profile-images/{userId}/`
- ✅ **Pet images**: Users can upload to `/pet-images/{userId}/`
- ✅ **Size limits**: 5MB for profile images, 10MB for pet images
- ✅ **Security**: Only authenticated users can upload to their own folders
- ✅ **Public read**: Anyone can view images (for displaying)

## Test the Upload:

1. Open your app in the browser
2. Go to Settings page
3. Try uploading a profile image
4. Check browser console for any errors

## Debug Steps:

If upload still doesn't work:

1. **Check browser console** for error messages
2. **Run the test function** in browser console:
   ```javascript
   // Import and run the test
   import('./src/lib/test-storage-upload.js').then(module => {
     module.testStorageUpload();
   });
   ```

3. **Common error codes**:
   - `storage/unauthorized` → Storage rules not deployed
   - `storage/object-not-found` → Wrong Firebase project
   - `storage/quota-exceeded` → Storage quota full

## File Structure:
```
Firebase Storage:
├── profile-images/
│   └── {userId}/
│       └── {timestamp}-{filename}
└── pet-images/
    └── {userId}/
        └── {timestamp}-{filename}
```

## Your Current Upload Code:
The upload code in `SettingsPage.tsx` is correct and should work once the storage rules are deployed.

## Need Help?
If you're still having issues, check:
1. Firebase project ID is correct in your config
2. Storage is enabled in Firebase Console
3. You're logged in as an authenticated user
4. The file size is under 5MB
5. The file is an image (jpg, png, etc.)
